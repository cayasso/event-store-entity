# event-store-entity

[![Build Status](https://travis-ci.org/cayasso/event-store-entity.png?branch=master)](https://travis-ci.org/cayasso/event-store-entity)
[![NPM version](https://badge.fury.io/js/event-store-entity.png)](http://badge.fury.io/js/event-store-entity)

Entity class for the [event-store](https://github.com/cayasso/event-store) project.

## Installation

``` bash
$ npm install event-store-entity
```

## Usage

```js
import Entity from 'event-store-entity';

class TestEntity extends Entity {

  constructor(id) {
    super();
    this.id = id || ++id;
    this.status = 'created';
  }

  init() {
    this.status = 'initiated';
    this.record('init');
    return this;
  }

  start(data) {
    this.status = 'started';
    this.startedBy = data.agent;
    this.record('start', data);
    this.emit('started');
    return this;
  }

  end(data) {
    this.status = 'ended';
    this.endedBy = data.agent;
    this.record('end', data);
    this.enqueue('ended');
    return this;
  }
}

// Take a snapshot of the entity
const snapshot = entity.snap();

// Apply an event or an array of events to an entity
entity.replay(events);

// Restore an entity from a snapshot
entity.restore(snapshot);
```

## API

### Entity();

Abstract class for extending and creating new entity classes.

```js
class Order extends Entity {

  constructor(id) {
    super();
    this.id = id || ++id;
    this.status = 'created';
  }
  //...
}

const order = new Order(1);

```

### entity.record(cmd, data)

Record entity event and parameters.

```js
class TestEntity extends Entity {

  //...

  start(data) {
    this.status = 'started';
    this.startedBy = data.agent;

    // Will push event to this.events array
    this.record('start', data);
    return this;
  }
}

```

### entity.reply(event)

Apply one or multiple events to an entity.

```js
const event = {
  cmd: 'end',
  data: { agent: 'jeff' },
  id: 1,
  ts: 1453945415486,
  version: 0,
  revision: 1,
  scope: 'TestEntity'
};

entity.reply(event);

// or

const events = [
  { cmd: 'end',
    data: { agent: 'jonathan' },
    id: 1,
    ts: 1453945415486,
    version: 0,
    revision: 1,
    scope: 'TestEntity' },
  { cmd: 'end',
    data: { agent: 'jack' },
    id: 2,
    ts: 1453945415486,
    version: 0,
    revision: 2,
    scope: 'TestEntity' }
]

entity.reply(events);
```

### entity.emit(event, data)

Emit an entity event.

```js
// Sending event after a commit.
entity.emit('started', data);

// Subscribing to event.
entity.on('started', data => {
  console.log(data);
})
```

### entity.enqueue(event, data)

Wait to emit an event after it is committed.

```js

// Sending event after a commit.
entity.enqueue('ended', data);

// Subscribing to event.
entity.on('ended', data => {
  console.log(data);
})
```

### entity.snap()

Create a snapshot of an entity state.

```js
const snapshot = entity.snap();
console.log(snapshot);

/*
TestEntity {
  version: 2,
  revision: 2,
  ts: 1453945110760,
  id: 1,
  scope: 'TestEntity',
  status: 'ended',
  startedBy: 'jonathan',
  endedBy: 'raul' }
*/

```

### entity.restore(snap)

Restore an entity from a snapshot.

```js
const snapshot = entity.snap();

// days after
entity.restore(snapshot);
```

## Run tests

```bash
$ make test
```

## Credits

This library was inspired by the [sourced](https://github.com/mateodelnorte/sourced) project.

## License

(The MIT License)

Copyright (c) 2016 Jonathan Brumley &lt;cayasso@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
