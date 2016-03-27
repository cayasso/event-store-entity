'use strict';

/**
 * Module dependencies.
 */

import { predefine, applyEvent, makeEvent } from './utils';
import { clone, merge, omit, isEqual } from 'lodash';
import Emitter from 'eventemitter3';
import dbg from 'debug';

/**
 * Module variables.
 */

const debug = dbg('event-store:entity');
const isArray = Array.isArray;
const event = Symbol('event');
const apply = Symbol('apply');

export class EntityError extends Error {
  constructor(message, logger) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
    if (logger) logger.emit('error', this);
  }
}

export default class Entity extends Emitter {

  /**
   * Entity constructor.
   *
   * @return {Entity} this
   * @api public
   */

  constructor() {
    super();

    if (this.constructor === Entity) {
      throw new EntityError('Can not instantiate abstract class.', this);
    }

    predefine(this);
    this.version = 0;
    this.revision = 0;
    this.ts = Date.now();
    this.scope = this.constructor.name;
    this.writable('replaying', false);
    this.writable('_events', {});
    this.writable('events', []);
    this.writable('queue', []);
    this[apply] = applyEvent(this);
    this[event] = makeEvent(this);
  }

  /**
   * Emit events.
   *
   * @return {Entity} this
   * @api public
   */

  emit() {
    if (!this.replaying) super.emit(...arguments);
    return this;
  }

  /**
   * Apply event to entity.
   *
   * @param {String} cmd
   * @param {Event} e
   * @return {Entity}
   * @api public
   */

  record(cmd, data) {
    if (this.replaying) return this;
    this[apply](this[event](cmd, data), false);
    return this;
  }

  /**
   * Replay a single or multitple events.
   *
   * @param {Event|Array} event
   * @return {Entity} this
   * @api public
   */

  replay(event) {
    isArray(event) ? event.map(this.replay, this) : this[apply](event, true);
    return this;
  }

  /**
   * Restore to snapshot.
   *
   * @param {Snapshot} snap
   * @return {Entity}
   * @api public
   */

  restore(snap) {
    this.merge(omit(snap, '_id'));
    return this;
  }

  /**
   * Merge data into entity.
   *
   * @param {Object} data
   * @return {Entity}
   * @api public
   */

  merge(data) {
    return merge(this, data);
  }

  /**
   * Take a snapshot of this entity.
   *
   * @return {Snapshot}
   * @api private
   */

  snap() {
    this.version = this.revision;
    return Object.freeze(clone(this, true));
  }

  /**
   * Add events to queue.
   *
   * @return {Entity} this
   * @api public
   */

  enqueue() {
    if (!this.replaying) this.queue.push(arguments);
    return this;
  }

  /**
   * Diff entity and provided data.
   *
   * @return {Object} diff
   * @api private
   */

  diff(data) {
    let res = {};
    for (let key in data) {
      if (isEqual(this[key], data[key])) continue;
      else res[key] = data[key];
    }
    return res;
  }

  /**
   * Merge operation info into provided data.
   *
   * @param {Object} data
   * @return {Object}
   * @api public
   */

  op(data) {
    let { ts, revision, version } = this;
    return { ...data, operation: { ts, revision, version }};
  }

  /**
   * Record and enqueue events.
   *
   * @param {String} cmd
   * @param {String} event
   * @param {Object} data
   * @param {Object} result
   * @api private
   */

  recordAndEnqueue(cmd, event, data, result) {
    this.record(cmd, data);
    this.enqueue(event, this.op(result));
    return result;
  }

}
