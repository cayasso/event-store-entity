'use strict';

import should from 'should';
import Entity from '../lib';

let id = 0;

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


describe('event-store-entity', function() {

  it('should be a function', () => {
    Entity.should.be.a.Function;
  });

  it('should throw error if trying to instantiate directly', function () {
    (function () {
      new Entity();
    }).should.throw('Can not instantiate abstract class.');
  });

  it('should have required methods', () => {
    let entity = new TestEntity(id++);
    entity.record.should.be.a.Function;
    entity.restore.should.be.a.Function;
    entity.replay.should.be.a.Function;
    entity.snap.should.be.a.Function;
    entity.enqueue.should.be.a.Function;
  });

  it('should set class name as scope', () => {
    class Order extends Entity {}
    (new Order).scope.should.be.equal('Order');
  });

  it('should record events', () => {
    let entity = new TestEntity(id++);
    entity.start({ agent: 'jonathan' });
    entity.end({ agent: 'raul' });
    entity.events.length.should.be.eql(2);
    entity.events[0].cmd.should.be.eql('start');
    entity.events[0].should.have.properties(['id', 'ts', 'scope', 'cmd', 'data', 'version', 'revision']);
    entity.events[0].data.should.have.properties({ agent: 'jonathan' });
    entity.events[1].cmd.should.be.eql('end');
    entity.events[1].should.have.properties(['id', 'ts', 'scope', 'cmd', 'data', 'version', 'revision']);
    entity.events[1].data.should.have.properties({ agent: 'raul' });
  });

  it('should increment revision when recording events', () => {
    let entity = new TestEntity(id++);
    entity.revision.should.be.eql(0);
    entity.start({ agent: 'jonathan' });
    entity.revision.should.be.eql(1);
    entity.end({ agent: 'raul' });
    entity.revision.should.be.eql(2);
  });

  it('should emit events', (done) => {
    let entity = new TestEntity(id++);
    entity.revision.should.be.eql(0);
    entity.on('started', done);
    entity.start({ agent: 'jonathan' });
  });

  it('should replay a single event', () => {
    let entity = new TestEntity(id++);
    entity.replay({
      "cmd": "start",
      "data": { "agent": "tomas" },
      "id": entity.id,
      "revision": 1,
      "ts": 1442799956314,
      "scope": "TestEntity"
    });
    entity.status.should.be.eql('started');
    entity.startedBy.should.be.eql('tomas');
    entity.revision.should.be.eql(1);
  });

  it('should replay an array of events', () => {
    let entity = new TestEntity(id++);
    entity.replay([{
      "cmd": "start",
      "data": { "agent": "tomas" },
      "id": entity.id,
      "revision": 1,
      "ts": 1442799956314,
      "scope": "TestEntity"
    },{
      "cmd": "end",
      "data": { "agent": "mery" },
      "id": entity.id,
      "revision": 2,
      "ts": 1442799956315,
      "scope": "TestEntity"
    }]);
    entity.status.should.be.eql('ended');
    entity.endedBy.should.be.eql('mery');
    entity.revision.should.be.eql(2);
  });

  it('should not emit events when replaying', () => {
    let entity = new TestEntity(id++);
    entity.on('start', () => {
      throw Error('Should not emit start');
    })
    entity.replay({
      "cmd": "start",
      "data": { "agent": "tomas" },
      "id": entity.id,
      "revision": 1,
      "ts": 1442799956314,
      "scope": "TestEntity"
    });
  });

  it('should not add replaying events to the array of events', () => {
    let entity = new TestEntity(id++);
    entity.replay({
      "cmd": "start",
      "data": { "agent": "tomas" },
      "id": entity.id,
      "revision": 1,
      "ts": 1442799956314,
      "scope": "TestEntity"
    });
    entity.events.should.be.empty();
  });

  it('should enqueue events adding them to the queue array', () => {
    let entity = new TestEntity(id++);
    entity.end({ agent: 'jonathan' });
    entity.end({ agent: 'jack' });
    entity.end({ agent: 'jeff' });
    entity.queue.length.should.be.eql(3);
    entity.queue[0][0].should.be.eql('ended');
    entity.queue[1][0].should.be.eql('ended');
    entity.queue[2][0].should.be.eql('ended');
  });

  it('should be able to take snapshots', () => {
    let entity = new TestEntity(id++);
    entity.start({ agent: 'jonathan' });
    entity.end({ agent: 'raul' });
    let snapshot = entity.snap();
    entity.should.have.properties(snapshot);
  });

  it('should be able to restore and entiry from snapshots', () => {
    let entity = new TestEntity(id++);
    let entity2 = new TestEntity(id++);
    entity.start({ agent: 'jonathan' });
    entity.end({ agent: 'raul' });
    let snapshot = entity.snap();
    entity2.restore(snapshot);
    entity.id.should.be.eql(entity2.id);
    entity.version.should.be.eql(2);
    entity.should.have.properties(entity2);
  });

});
