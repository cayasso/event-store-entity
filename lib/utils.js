'use strict';

/**
 * Module dependencies.
 */

import pre from 'predefine';
import { curry, isFunction } from 'lodash';

/**
 * Module variables.
 */

const noop = () => {};

/**
 * Set predefine cmdspaces.
 *
 * @param {Object} obj
 * @api private
 */

export const predefine = (obj) => {
  let writable = pre(obj, pre.WRITABLE);
  let readable = pre(obj, pre.READABLE);
  readable('writable', writable);
  readable('readable', readable);
};

/**
 * Make an immutable event.
 *
 * @param {Entity} entity
 * @param {String} cmd
 * @param {Object} data
 * @return {Event}
 * @api private
 */

export const makeEvent = curry((entity, cmd, data) => {
  entity.revision++;
  entity.ts = Date.now();
  const { id, ts, scope, version, revision } = entity;
  return Object.freeze({ cmd, data, id, ts, scope, version, revision });
});

/**
 * Apply event to an entity.
 *
 * @param {Entity} entity
 * @param {Event} event
 * @param {Boolean} replay
 * @api private
 */

export const applyEvent = curry((entity, event, replay) => {
  let fn = entity[event.cmd];
  entity.ts = event.ts;
  entity.scope = event.scope;
  entity.revision = event.revision;
  if (!replay) return entity.events.push(event);
  if (!isFunction(fn)) return entity;
  entity.replaying = replay;
  fn.call(entity, event.data, noop);
  entity.replaying = !replay;
});
