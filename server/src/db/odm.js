/**
 * Minimal DynamoDB document mapper.
 *
 * Provides the small subset of the Mongoose-style API that the controllers use
 * (find/findOne/findById/create/save/populate/sort/select/updateMany/aggregate...)
 * on top of DynamoDB. One table per model, partition key `_id`.
 * Queries use Scan + in-memory filtering, which is fine at this app's data size;
 * add GSIs / Query calls here if the dataset grows large.
 */
import crypto from 'crypto';
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { getClients, tableName } from './dynamo.js';

/* ------------------------------------------------------------------ errors */
export class ValidationError extends Error {
  constructor(errors) {
    const list = Object.values(errors);
    super(list[0]?.message || 'Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}
export class DuplicateKeyError extends Error {
  constructor(field) {
    super(`Duplicate value detected for ${field}.`);
    this.name = 'DuplicateKeyError';
    this.field = field;
    this.statusCode = 409;
  }
}

/* --------------------------------------------------------------------- ids */
let counter = 0;
export const newId = () => {
  counter = (counter + 1) % 0xffff;
  return (
    Date.now().toString(16).padStart(12, '0') +
    counter.toString(16).padStart(4, '0') +
    crypto.randomBytes(4).toString('hex')
  );
};
export const isValidId = (v) => typeof v === 'string' && /^[0-9a-f]{24}$/i.test(v);

/* ----------------------------------------------------------- value helpers */
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof Doc);

function toStorage(v) {
  if (v === undefined) return undefined;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Doc) return String(v._id);
  if (Array.isArray(v)) return v.map(toStorage).filter((x) => x !== undefined);
  if (isPlain(v)) {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      const s = toStorage(val);
      if (s !== undefined) out[k] = s;
    }
    return out;
  }
  return v;
}

function fromStorage(v) {
  if (typeof v === 'string' && ISO_RE.test(v)) return new Date(v);
  if (Array.isArray(v)) return v.map(fromStorage);
  if (isPlain(v)) {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = fromStorage(val);
    return out;
  }
  return v;
}

function clone(v) {
  if (v instanceof Date) return new Date(v.getTime());
  if (v instanceof Doc) return v.toObject();
  if (Array.isArray(v)) return v.map(clone);
  if (isPlain(v)) {
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = clone(val);
    return o;
  }
  return v;
}

const norm = (v) => {
  if (v instanceof Date) return v.getTime();
  if (v instanceof Doc) return String(v._id);
  if (v && typeof v === 'object' && v._id !== undefined && !Array.isArray(v)) return String(v._id);
  return v;
};

const getPath = (obj, path) => {
  let cur = obj;
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[part];
  }
  return cur;
};

/* -------------------------------------------------------- schema handling */
const isFieldSpec = (s) => s && typeof s === 'object' && !Array.isArray(s) && 'type' in s && typeof s.type !== 'object';

function castValue(spec, value, path, errors, { validate }) {
  const t = spec.type;
  if (value === undefined || value === null) return value;
  switch (t) {
    case 'string': {
      let s = typeof value === 'string' ? value : String(value);
      if (spec.trim) s = s.trim();
      if (spec.lowercase) s = s.toLowerCase();
      if (validate && spec.enum && s !== '' && !spec.enum.includes(s)) {
        errors[path] = { message: `\`${s}\` is not a valid ${path}.` };
      }
      return s;
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) {
        errors[path] = { message: `Cast to Number failed for value "${value}" at path "${path}"` };
        return value;
      }
      if (validate && spec.min !== undefined && n < spec.min) errors[path] = { message: `${path} must be at least ${spec.min}.` };
      if (validate && spec.max !== undefined && n > spec.max) errors[path] = { message: `${path} must be at most ${spec.max}.` };
      return n;
    }
    case 'boolean':
      return typeof value === 'boolean' ? value : value === 'true' || value === true || value === 1;
    case 'date': {
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) {
        errors[path] = { message: `Cast to date failed for value "${value}" at path "${path}"` };
        return value;
      }
      return d;
    }
    case 'id':
      if (value && typeof value === 'object' && value._id !== undefined) return String(value._id);
      return String(value);
    default: // 'mixed'
      return value;
  }
}

const defaultOf = (spec) => (typeof spec.default === 'function' ? spec.default() : spec.default);

/** Cast `data` according to `schema`, filling defaults. Returns a new object. */
function castObject(schema, data, basePath, errors, opts) {
  const out = {};
  const src = data && typeof data === 'object' ? data : {};
  for (const [key, spec] of Object.entries(schema)) {
    const path = basePath ? `${basePath}.${key}` : key;
    let val = src[key];

    if (Array.isArray(spec)) {
      const item = spec[0];
      const arr = Array.isArray(val) ? val : val === undefined || val === null ? [] : [val];
      if (item && !isFieldSpec(item) && typeof item === 'object' && item.__sub) {
        out[key] = arr.map((el, i) => castSub(item, el, `${path}.${i}`, errors, opts));
      } else {
        out[key] = arr.map((el) => castValue(item, el, path, errors, opts));
      }
    } else if (isFieldSpec(spec)) {
      if (val === undefined) val = defaultOf(spec);
      if (val === undefined || val === null) {
        if (opts.validate && spec.required && val === undefined) errors[path] = { message: `Path \`${path}\` is required.` };
        if (val === null) out[key] = null;
        else if (spec.required && opts.validate) {
          /* error recorded */
        }
        continue;
      }
      if (opts.validate && spec.required && val === '') errors[path] = { message: `Path \`${path}\` is required.` };
      out[key] = castValue(spec, val, path, errors, opts);
    } else if (spec && spec.__sub) {
      out[key] = castSub(spec, val === undefined ? {} : val, path, errors, opts);
    } else {
      // plain nested object
      out[key] = castObject(spec, val, path, errors, opts);
    }
  }
  // keep unknown keys (e.g. Mixed metadata sub-keys set by controllers) untouched
  for (const k of Object.keys(src)) {
    if (!(k in schema) && !['_id', 'createdAt', 'updatedAt', '__v'].includes(k)) out[k] = src[k];
  }
  return out;
}

function castSub(sub, el, path, errors, opts) {
  const { __sub, ...schema } = sub;
  const base = castObject(schema, el, path, errors, opts);
  if (__sub.id !== false) base._id = el && el._id ? String(el._id) : newId();
  if (__sub.timestamps) {
    base.createdAt = el?.createdAt ? new Date(el.createdAt) : new Date();
    base.updatedAt = el?.updatedAt ? new Date(el.updatedAt) : base.createdAt;
  }
  return base;
}

/** Marks a nested schema as a sub-document (array element / embedded doc). */
export const sub = (schema, options = {}) => ({ ...schema, __sub: options });

/* --------------------------------------------------------------- selection */
function applySelect(raw, selectStr, hidden) {
  const tokens = (selectStr || '').split(/\s+/).filter(Boolean);
  const plus = tokens.filter((t) => t.startsWith('+')).map((t) => t.slice(1));
  const minus = tokens.filter((t) => t.startsWith('-')).map((t) => t.slice(1));
  const include = tokens.filter((t) => !t.startsWith('+') && !t.startsWith('-'));
  const out = {};
  let strippedHidden = false;
  if (include.length) {
    out._id = raw._id;
    for (const f of [...include, ...plus]) if (f in raw) out[f] = raw[f];
  } else {
    for (const [k, v] of Object.entries(raw)) {
      if (hidden.includes(k) && !plus.includes(k)) {
        strippedHidden = true;
        continue;
      }
      out[k] = v;
    }
  }
  for (const f of minus) delete out[f];
  return { data: out, partial: include.length > 0 || strippedHidden };
}

/* ---------------------------------------------------------------- matching */
function matchValue(docVal, cond) {
  const isOps = isPlain(cond) && Object.keys(cond).some((k) => k.startsWith('$')) && !(cond instanceof RegExp);
  const arr = Array.isArray(docVal) ? docVal : null;
  const anyOf = (fn) => (arr ? arr.some(fn) : fn(docVal));

  if (cond instanceof RegExp) return anyOf((v) => typeof v === 'string' && cond.test(v));
  if (!isOps) {
    const c = norm(cond);
    if (c === null || c === undefined) return arr ? arr.length === 0 || arr.some((v) => v == null) : docVal === null || docVal === undefined;
    return anyOf((v) => norm(v) === c);
  }
  for (const [op, operand] of Object.entries(cond)) {
    const o = Array.isArray(operand) ? operand.map(norm) : norm(operand);
    switch (op) {
      case '$in':
        if (!anyOf((v) => o.includes(norm(v)) || (v == null && o.includes(null)))) return false;
        break;
      case '$nin':
        if (anyOf((v) => o.includes(norm(v)))) return false;
        break;
      case '$ne':
        if (anyOf((v) => norm(v) === o)) return false;
        break;
      case '$eq':
        if (!anyOf((v) => norm(v) === o)) return false;
        break;
      case '$gt':
        if (!anyOf((v) => v != null && norm(v) > o)) return false;
        break;
      case '$gte':
        if (!anyOf((v) => v != null && norm(v) >= o)) return false;
        break;
      case '$lt':
        if (!anyOf((v) => v != null && norm(v) < o)) return false;
        break;
      case '$lte':
        if (!anyOf((v) => v != null && norm(v) <= o)) return false;
        break;
      case '$exists':
        if ((docVal !== undefined) !== Boolean(operand)) return false;
        break;
      case '$regex': {
        const rx = operand instanceof RegExp ? operand : new RegExp(operand, cond.$options || '');
        if (!anyOf((v) => typeof v === 'string' && rx.test(v))) return false;
        break;
      }
      case '$options':
        break;
      default:
        throw new Error(`Unsupported query operator ${op}`);
    }
  }
  return true;
}

export function matches(raw, filter = {}) {
  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or') {
      if (!cond.some((f) => matches(raw, f))) return false;
    } else if (key === '$and') {
      if (!cond.every((f) => matches(raw, f))) return false;
    } else if (!matchValue(getPath(raw, key), cond)) {
      return false;
    }
  }
  return true;
}

const compare = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return 0;
  if (x === undefined || x === null) return -1;
  if (y === undefined || y === null) return 1;
  return x < y ? -1 : 1;
};

function parseSort(spec) {
  if (!spec) return [];
  if (typeof spec === 'string') {
    return spec.split(/\s+/).filter(Boolean).map((t) => (t.startsWith('-') ? [t.slice(1), -1] : [t, 1]));
  }
  return Object.entries(spec).map(([k, d]) => [k, d === -1 || d === 'desc' ? -1 : 1]);
}

/* ---------------------------------------------------------------- document */
export class Doc {
  constructor(model, data = {}, { isNew = true, partial = false, selectedHidden = [] } = {}) {
    // Documents loaded from the DB are created as plain Docs; give them the model's prototype
    // so model-specific instance methods (e.g. User#comparePassword) are available.
    if (model && Object.getPrototypeOf(this) !== model.prototype) Object.setPrototypeOf(this, model.prototype);
    Object.defineProperty(this, '__model', { value: model, enumerable: false });
    Object.defineProperty(this, '__isNew', { value: isNew, enumerable: false, writable: true });
    Object.defineProperty(this, '__partial', { value: partial, enumerable: false, writable: true });
    Object.defineProperty(this, '__snapshot', { value: {}, enumerable: false, writable: true });
    Object.defineProperty(this, '__selectedHidden', { value: selectedHidden, enumerable: false });
    Object.assign(this, data);
    if (!isNew) this.__takeSnapshot();
  }

  get id() {
    return this._id;
  }

  __takeSnapshot() {
    const snap = {};
    for (const [k, v] of Object.entries(this)) snap[k] = JSON.stringify(toStorage(v));
    this.__snapshot = snap;
  }

  toObject() {
    const o = {};
    for (const [k, v] of Object.entries(this)) o[k] = clone(v);
    return o;
  }

  toJSON() {
    const hidden = this.__model.hidden;
    const o = {};
    for (const [k, v] of Object.entries(this)) {
      if (hidden.includes(k)) continue;
      o[k] = v;
    }
    return o;
  }

  async save() {
    const model = this.__model;
    const errors = {};
    const casted = castObject(model.schema, this.toObject(), '', errors, { validate: !this.__partial });
    if (Object.keys(errors).length) throw new ValidationError(errors);
    // write casted values back (defaults / casts), preserving metadata fields
    for (const k of Object.keys(casted)) {
      if (this.__partial && !(k in this)) continue;
      this[k] = casted[k];
    }
    const now = new Date();
    if (this.__isNew) {
      if (!this._id) this._id = newId();
      this.createdAt = this.createdAt || now;
      this.updatedAt = now;
      await model.__checkUnique(this, true);
      await model.__put(this);
      this.__isNew = false;
      this.__takeSnapshot();
      return this;
    }
    const changed = Object.keys(this).filter(
      (k) => k !== '_id' && k !== 'updatedAt' && JSON.stringify(toStorage(this[k])) !== this.__snapshot[k]
    );
    if (!changed.length) return this;
    this.updatedAt = now;
    await model.__checkUnique(this, false, changed);
    await model.__updateKeys(this, [...changed, 'updatedAt']);
    this.__takeSnapshot();
    return this;
  }

  async deleteOne() {
    await this.__model.__delete(this._id);
    return this;
  }
  remove() {
    return this.deleteOne();
  }
}

/* ------------------------------------------------------------------- query */
class Query {
  constructor(model, { filter = {}, single = false, byId = null } = {}) {
    this.model = model;
    this.filter = filter;
    this.single = single;
    this.byId = byId;
    this._sort = [];
    this._limit = 0;
    this._skip = 0;
    this._select = '';
    this._populate = [];
    this._lean = false;
  }
  sort(s) {
    this._sort = parseSort(s);
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  skip(n) {
    this._skip = n;
    return this;
  }
  select(s) {
    this._select = `${this._select} ${s}`.trim();
    return this;
  }
  populate(path, select) {
    this._populate.push({ path, select });
    return this;
  }
  lean() {
    this._lean = true;
    return this;
  }
  exec() {
    return this.then((v) => v);
  }
  then(resolve, reject) {
    return this.__run().then(resolve, reject);
  }
  catch(fn) {
    return this.__run().catch(fn);
  }

  async __run() {
    const m = this.model;
    let rows;
    if (this.byId !== null) {
      const item = this.byId ? await m.__get(this.byId) : null;
      rows = item ? [item] : [];
    } else {
      rows = (await m.__scan()).filter((r) => matches(r, this.filter));
    }
    const sorts = this._sort.length ? this._sort : [['_id', 1]];
    rows.sort((a, b) => {
      for (const [f, dir] of sorts) {
        const c = compare(getPath(a, f), getPath(b, f));
        if (c) return c * dir;
      }
      return compare(a._id, b._id);
    });
    if (this._skip) rows = rows.slice(this._skip);
    if (this.single) rows = rows.slice(0, 1);
    else if (this._limit) rows = rows.slice(0, this._limit);

    let docs = rows.map((raw) => {
      const { data, partial } = applySelect(raw, this._select, m.hidden);
      return new Doc(m, data, { isNew: false, partial });
    });

    for (const { path, select } of this._populate) {
      const refModelName = m.refs[path];
      if (!refModelName) continue;
      const refModel = registry[refModelName];
      const ids = [...new Set(docs.map((d) => d[path]).filter(Boolean).map(String))];
      const found = await refModel.__getMany(ids);
      const byId = new Map(found.map((r) => [String(r._id), r]));
      for (const d of docs) {
        if (!d[path]) continue;
        const raw = byId.get(String(d[path]));
        if (!raw) {
          d[path] = null;
          continue;
        }
        const { data, partial } = applySelect(raw, select, refModel.hidden);
        d[path] = new Doc(refModel, data, { isNew: false, partial });
      }
    }

    if (this._lean) docs = docs.map((d) => d.toObject());
    if (this.single) return docs[0] || null;
    return docs;
  }
}

/* ------------------------------------------------------------------- model */
const registry = {};
export const modelNames = () => Object.keys(registry);

export function defineModel(name, { schema, unique = [], hidden = [], refs = {} }) {
  const table = () => tableName(name);

  class Model extends Doc {
    constructor(data = {}) {
      const errors = {};
      const casted = castObject(schema, data, '', errors, { validate: false });
      super(Model, casted, { isNew: true });
      if (data._id) this._id = String(data._id);
    }
  }

  Object.defineProperty(Model, 'name', { value: name });
  Model.modelName = name;
  Model.schema = schema;
  Model.hidden = hidden;
  Model.refs = refs;

  /* ---- low level ---- */
  Model.__get = async (id) => {
    const { docClient } = getClients();
    const out = await docClient.send(new GetCommand({ TableName: table(), Key: { _id: String(id) }, ConsistentRead: true }));
    return out.Item ? fromStorage(out.Item) : null;
  };
  Model.__getMany = async (ids) => {
    if (!ids.length) return [];
    const { docClient } = getClients();
    const results = [];
    for (let i = 0; i < ids.length; i += 100) {
      let keys = ids.slice(i, i + 100).map((id) => ({ _id: id }));
      let attempts = 0;
      while (keys.length && attempts < 6) {
        const out = await docClient.send(
          new BatchGetCommand({ RequestItems: { [table()]: { Keys: keys, ConsistentRead: true } } })
        );
        results.push(...(out.Responses?.[table()] || []).map(fromStorage));
        keys = out.UnprocessedKeys?.[table()]?.Keys || [];
        attempts += 1;
      }
    }
    return results;
  };
  Model.__scan = async () => {
    const { docClient } = getClients();
    const items = [];
    let key;
    do {
      const out = await docClient.send(new ScanCommand({ TableName: table(), ExclusiveStartKey: key, ConsistentRead: true }));
      items.push(...(out.Items || []).map(fromStorage));
      key = out.LastEvaluatedKey;
    } while (key);
    return items;
  };
  Model.__put = async (doc) => {
    const { docClient } = getClients();
    await docClient.send(new PutCommand({ TableName: table(), Item: toStorage(doc.toObject()) }));
  };
  Model.__updateKeys = async (doc, keys) => {
    const { docClient } = getClients();
    const names = {};
    const values = {};
    const sets = [];
    const removes = [];
    keys.forEach((k, i) => {
      const v = toStorage(doc[k]);
      names[`#k${i}`] = k;
      if (v === undefined) removes.push(`#k${i}`);
      else {
        values[`:v${i}`] = v;
        sets.push(`#k${i} = :v${i}`);
      }
    });
    const expr = [sets.length ? `SET ${sets.join(', ')}` : '', removes.length ? `REMOVE ${removes.join(', ')}` : '']
      .filter(Boolean)
      .join(' ');
    await docClient.send(
      new UpdateCommand({
        TableName: table(),
        Key: { _id: String(doc._id) },
        UpdateExpression: expr,
        ExpressionAttributeNames: names,
        ...(Object.keys(values).length ? { ExpressionAttributeValues: values } : {}),
      })
    );
  };
  Model.__delete = async (id) => {
    const { docClient } = getClients();
    await docClient.send(new DeleteCommand({ TableName: table(), Key: { _id: String(id) } }));
  };
  Model.__checkUnique = async (doc, isNew, changedKeys = null) => {
    const fields = unique.filter((f) => (isNew ? doc[f] !== undefined : changedKeys.includes(f)));
    if (!fields.length) return;
    const rows = await Model.__scan();
    for (const f of fields) {
      const clash = rows.find((r) => String(r._id) !== String(doc._id) && norm(r[f]) === norm(doc[f]));
      if (clash) throw new DuplicateKeyError(f);
    }
  };

  /* ---- mongoose-style statics ---- */
  Model.find = (filter = {}) => new Query(Model, { filter });
  Model.findOne = (filter = {}) => new Query(Model, { filter, single: true });
  Model.findById = (id) => new Query(Model, { single: true, byId: id ? String(id) : '' });
  Model.countDocuments = async (filter = {}) => (await Model.__scan()).filter((r) => matches(r, filter)).length;
  Model.distinct = async (field, filter = {}) => {
    const vals = (await Model.__scan()).filter((r) => matches(r, filter)).map((r) => getPath(r, field));
    return [...new Set(vals.flat().filter((v) => v !== undefined && v !== null).map((v) => String(norm(v))))];
  };
  Model.create = async (data) => {
    if (Array.isArray(data)) {
      const out = [];
      for (const d of data) out.push(await new Model(d).save());
      return out;
    }
    return new Model(data).save();
  };
  Model.insertMany = async (arr) => {
    const docs = arr.map((d) => new Model(d));
    for (const d of docs) {
      const errors = {};
      castObject(schema, d.toObject(), '', errors, { validate: true });
      if (Object.keys(errors).length) throw new ValidationError(errors);
    }
    const now = new Date();
    for (const d of docs) {
      d._id = d._id || newId();
      d.createdAt = now;
      d.updatedAt = now;
    }
    if (unique.length) for (const d of docs) await d.__model.__checkUnique(d, true);
    const { docClient } = getClients();
    for (let i = 0; i < docs.length; i += 25) {
      let reqs = docs.slice(i, i + 25).map((d) => ({ PutRequest: { Item: toStorage(d.toObject()) } }));
      let attempts = 0;
      while (reqs.length && attempts < 6) {
        const out = await docClient.send(new BatchWriteCommand({ RequestItems: { [table()]: reqs } }));
        reqs = out.UnprocessedItems?.[table()] || [];
        attempts += 1;
      }
    }
    docs.forEach((d) => {
      d.__isNew = false;
      d.__takeSnapshot();
    });
    return docs;
  };

  const applyUpdate = (raw, update) => {
    const hasOps = Object.keys(update).some((k) => k.startsWith('$'));
    const set = hasOps ? update.$set || {} : update;
    for (const [k, v] of Object.entries(set)) raw[k] = v;
    for (const [k, v] of Object.entries(update.$inc || {})) raw[k] = (Number(getPath(raw, k)) || 0) + v;
    for (const [k, v] of Object.entries(update.$addToSet || {})) {
      const arr = Array.isArray(raw[k]) ? raw[k] : [];
      if (!arr.some((x) => norm(x) === norm(v))) arr.push(v);
      raw[k] = arr;
    }
    for (const [k, v] of Object.entries(update.$push || {})) raw[k] = [...(raw[k] || []), v];
    return raw;
  };

  const updateRow = async (raw, update) => {
    const before = JSON.parse(JSON.stringify(toStorage(raw)));
    const next = applyUpdate(fromStorage(before), update);
    const errors = {};
    const casted = castObject(schema, next, '', errors, { validate: false });
    const doc = new Doc(Model, { ...next, ...casted, _id: raw._id, createdAt: raw.createdAt }, { isNew: false });
    const keys = Object.keys(update.$inc || {})
      .concat(Object.keys(update.$addToSet || {}), Object.keys(update.$push || {}))
      .concat(Object.keys(update.$set || (Object.keys(update).some((k) => k.startsWith('$')) ? {} : update)));
    doc.updatedAt = new Date();
    await Model.__updateKeys(doc, [...new Set([...keys.map((k) => k.split('.')[0]), 'updatedAt'])]);
    return doc;
  };

  Model.updateMany = async (filter, update) => {
    const rows = (await Model.__scan()).filter((r) => matches(r, filter));
    for (const r of rows) await updateRow(r, update);
    return { matchedCount: rows.length, modifiedCount: rows.length };
  };
  Model.findByIdAndUpdate = async (id, update, options = {}) => {
    const raw = id ? await Model.__get(id) : null;
    if (!raw) return null;
    const doc = await updateRow(raw, update);
    return options.new ? doc : new Doc(Model, raw, { isNew: false });
  };
  Model.findOneAndUpdate = async (filter, update, options = {}) => {
    const raw = (await Model.__scan()).filter((r) => matches(r, filter)).sort((a, b) => compare(a._id, b._id))[0];
    if (!raw) return null;
    const doc = await updateRow(raw, update);
    return options.new ? doc : new Doc(Model, raw, { isNew: false });
  };
  Model.findByIdAndDelete = async (id) => {
    const raw = id ? await Model.__get(id) : null;
    if (!raw) return null;
    await Model.__delete(id);
    return new Doc(Model, raw, { isNew: false });
  };
  Model.deleteOne = async (filter) => {
    const raw = (await Model.__scan()).find((r) => matches(r, filter));
    if (raw) await Model.__delete(raw._id);
    return { deletedCount: raw ? 1 : 0 };
  };
  Model.deleteMany = async (filter = {}) => {
    const rows = (await Model.__scan()).filter((r) => matches(r, filter));
    const { docClient } = getClients();
    for (let i = 0; i < rows.length; i += 25) {
      let reqs = rows.slice(i, i + 25).map((r) => ({ DeleteRequest: { Key: { _id: r._id } } }));
      let attempts = 0;
      while (reqs.length && attempts < 6) {
        const out = await docClient.send(new BatchWriteCommand({ RequestItems: { [table()]: reqs } }));
        reqs = out.UnprocessedItems?.[table()] || [];
        attempts += 1;
      }
    }
    return { deletedCount: rows.length };
  };

  /** Supports $match and $group ($sum / $addToSet) stages. */
  Model.aggregate = async (pipeline) => {
    let rows = await Model.__scan();
    for (const stage of pipeline) {
      if (stage.$match) {
        rows = rows.filter((r) => matches(r, stage.$match));
      } else if (stage.$group) {
        const { _id: idSpec, ...accs } = stage.$group;
        const resolve = (r, spec) => {
          if (typeof spec === 'string' && spec.startsWith('$')) return norm(getPath(r, spec.slice(1)));
          if (isPlain(spec)) return Object.fromEntries(Object.entries(spec).map(([k, s]) => [k, resolve(r, s)]));
          return spec;
        };
        const groups = new Map();
        for (const r of rows) {
          const id = resolve(r, idSpec);
          const key = JSON.stringify(id);
          if (!groups.has(key)) groups.set(key, { _id: id, __rows: [] });
          groups.get(key).__rows.push(r);
        }
        rows = [...groups.values()].map((g) => {
          const out = { _id: g._id };
          for (const [name, acc] of Object.entries(accs)) {
            if ('$sum' in acc) {
              out[name] = g.__rows.reduce((s, r) => s + (typeof acc.$sum === 'number' ? acc.$sum : Number(resolve(r, acc.$sum)) || 0), 0);
            } else if ('$addToSet' in acc) {
              out[name] = [...new Set(g.__rows.map((r) => resolve(r, acc.$addToSet)))];
            } else throw new Error(`Unsupported accumulator for ${name}`);
          }
          return out;
        });
      } else {
        throw new Error(`Unsupported aggregation stage ${Object.keys(stage)[0]}`);
      }
    }
    return rows;
  };

  registry[name] = Model;
  return Model;
}
