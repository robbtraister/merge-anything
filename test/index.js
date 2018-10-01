import test from 'ava'
import merge from '../dist/index.cjs'
import { isDate, isFunction, isString, isArray, isObject } from 'is-what'

function cloneFn (originVal, targetVal) {
  if (isObject(targetVal)) return JSON.parse(JSON.stringify(targetVal))
  return targetVal
}

test('1. origin & target stays the same | 2. works with dates', t => {
  let res, origin, target
  const nd = new Date()
  origin = {body: 'a'}
  target = {dueDate: nd}
  res = merge(origin, target)
  t.deepEqual(res, {body: 'a', dueDate: nd})
  t.deepEqual(origin, {body: 'a'})
  t.deepEqual(target, {dueDate: nd})
})
test('1. works with multiple levels | 2. overwrites entire object with null', t => {
  let res, origin, target
  origin = {body: '', head: null, toes: {big: true}, fingers: {'12': false}}
  target = {body: {}, head: {}, toes: {}, fingers: null}
  res = merge(origin, target)
  t.deepEqual(res, {body: {}, head: {}, toes: {big: true}, fingers: null})
})
test('origin and target are not modified', t => {
  let res, origin, target
  origin = {body: '', head: null, toes: {big: true}, fingers: {'12': false}}
  target = {body: {}, head: {}, toes: {}, fingers: null}
  res = merge(origin, target)
  t.deepEqual(res, {body: {}, head: {}, toes: {big: true}, fingers: null})
  t.deepEqual(origin, {body: '', head: null, toes: {big: true}, fingers: {'12': false}})
  t.deepEqual(target, {body: {}, head: {}, toes: {}, fingers: null})
  origin.body = 'a'
  origin.head = 'a'
  origin.toes.big = 'a'
  origin.fingers['12'] = 'a'
  target.body = 'b'
  target.head = 'b'
  target.toes = 'b'
  target.fingers = 'b'
  t.deepEqual(res, {body: {}, head: {}, toes: {big: true}, fingers: null})
  t.deepEqual(origin, {body: 'a', head: 'a', toes: {big: 'a'}, fingers: {'12': 'a'}})
  t.deepEqual(target, {body: 'b', head: 'b', toes: 'b', fingers: 'b'})
})
test('origin and target are not modified - with completely different props', t => {
  let res, origin, target
  // extend to clone vals
  origin = {body: '', head: null, toes: {big: true}, fingers: {'12': false}}
  target = {a: 'a', b: 'b', c: {d: {e: 'e'}}}
  res = merge({extensions: [cloneFn]}, origin, target)
  t.deepEqual(res, {body: '', head: null, toes: {big: true}, fingers: {'12': false}, a: 'a', b: 'b', c: {d: {e: 'e'}}})
  t.deepEqual(origin, {body: '', head: null, toes: {big: true}, fingers: {'12': false}})
  t.deepEqual(target, {a: 'a', b: 'b', c: {d: {e: 'e'}}})
  origin.body = 'a'
  origin.head = 'a'
  origin.toes.big = 'a'
  origin.fingers['12'] = 'a'
  target.a = 'x'
  target.b = 'x'
  target.c.d.e = 'x'
  t.deepEqual(origin, {body: 'a', head: 'a', toes: {big: 'a'}, fingers: {'12': 'a'}})
  t.deepEqual(target, {a: 'x', b: 'x', c: {d: {e: 'x'}}})
  t.deepEqual(res, {body: '', head: null, toes: {big: true}, fingers: {'12': false}, a: 'a', b: 'b', c: {d: {e: 'e'}}})
})
test('Clone Objects', t => {
  let clone, origin, target
  origin = {body: '', head: null, toes: {big: true}, fingers: {'12': false}}
  clone = merge({extensions: [cloneFn]}, origin)
  t.deepEqual(clone, {body: '', head: null, toes: {big: true}, fingers: {'12': false}})
  t.deepEqual(origin, {body: '', head: null, toes: {big: true}, fingers: {'12': false}})
  origin.body = 'a'
  origin.head = 'a'
  origin.toes.big = 'a'
  origin.fingers['12'] = 'a'
  t.deepEqual(clone, {body: '', head: null, toes: {big: true}, fingers: {'12': false}})
  t.deepEqual(origin, {body: 'a', head: 'a', toes: {big: 'a'}, fingers: {'12': 'a'}})
})
test('Overwrite arrays', t => {
  let res, origin, target
  origin = {array: ['a']}
  target = {array: ['b']}
  res = merge(origin, target)
  t.deepEqual(res, {array: ['b']})
})
test('Extend conversion', t => {
  let res, origin, target
  function convertTimestamps (originVal, targetVal) {
    if (
      originVal === '%convertTimestamp%' &&
      isString(targetVal) &&
      isDate(new Date(targetVal))
    ) {
      return new Date(targetVal)
    }
    return targetVal
  }
  origin = {
    date: '%convertTimestamp%'
  }
  target = {
    date: '1990-06-22'
  }
  res = merge({extensions: [convertTimestamps]}, origin, target)
  t.deepEqual(res, {date: new Date('1990-06-22')})
  res = merge({extensions: [convertTimestamps]}, '%convertTimestamp%', '1990-06-22')
  t.deepEqual(res, new Date('1990-06-22'))
})
test('Extend concat arrays', t => {
  let res, origin, target
  function concatArrays (originVal, targetVal) {
    if (isArray(originVal) && isArray(targetVal)) {
      return originVal.concat(targetVal)
    }
    return targetVal
  }
  origin = {
    someArray: ['a'],
    a: {b: {c: ['x']}}
  }
  target = {
    someArray: ['b'],
    a: {b: {c: ['y']}}
  }
  res = merge({extensions: [concatArrays]}, origin, target)
  t.deepEqual(res, {someArray: ['a', 'b'], a: {b: {c: ['x', 'y']}}})
  // also works on base lvl
  res = merge({extensions: [concatArrays]}, ['a'], ['b'])
  t.deepEqual(res, ['a', 'b'])
})
test('overwrites null with empty object', t => {
  let res, origin, target
  origin = {
    body: null
  }
  target = {
    body: {}
  }
  res = merge(origin, target)
  t.deepEqual(res, {body: {}})
})
test('overwrites null with object with props', t => {
  let res, origin, target
  origin = {
    body: null
  }
  target = {
    body: {props: true}
  }
  res = merge(origin, target)
  t.deepEqual(res, {body: {props: true}})
})
test('overwrites string values', t => {
  let res, origin, target
  origin = {body: 'a'}
  target = {body: 'b'}
  res = merge(origin, target)
  t.deepEqual(res, {body: 'b'})
  t.deepEqual(origin, {body: 'a'})
  t.deepEqual(target, {body: 'b'})
})
test('works with very deep props & dates', t => {
  let res, origin, target
  const newDate = new Date()
  origin = {
    info: {
      time: 'now',
      newDate,
      very: {
        deep: {
          prop: false
        }
      }
    }
  }
  target = {
    info: {
      date: 'tomorrow',
      very: {
        deep: {
          prop: true
        }
      }
    }
  }
  res = merge(origin, target)
  t.deepEqual(res, {
    info: {
      time: 'now',
      newDate,
      date: 'tomorrow',
      very: {
        deep: {
          prop: true
        }
      }
    }
  })
  t.deepEqual(origin, {
    info: {
      time: 'now',
      newDate,
      very: {
        deep: {prop: false}
      }
    }
  })
  t.deepEqual(target, {
    info: {
      date: 'tomorrow',
      very: {
        deep: {prop: true}
      }
    }
  })
  t.true(isDate(res.info.newDate))
})
test('1. does not overwrite origin prop if target prop is an empty object | 2. properly merges deep props', t => {
  let res, origin, target
  origin = {
    info: {
      time: {when: 'now'},
      very: {
        deep: {prop: false}
      }
    }
  }
  target = {
    info: {
      time: {},
      very: {whole: 1}
    }
  }
  res = merge(origin, target)
  t.deepEqual(res, {
    info: {
      time: {when: 'now'},
      very: {
        deep: {prop: false},
        whole: 1
      }
    }
  })
})
test('overwrites any origin prop when target prop is an object with props', t => {
  let res, origin, target
  origin = {
    body: 'a',
    body2: {head: false},
    tail: {}
  }
  target = {
    body: {head: true},
    body2: {head: {eyes: true}},
  }
  res = merge(origin, target)
  t.deepEqual(res, {
    body: {head: true},
    body2: {head: {eyes: true}},
    tail: {}
  })
  t.deepEqual(origin, {
    body: 'a',
    body2: {head: false},
    tail: {}
  })
  t.deepEqual(target, {
    body: {head: true},
    body2: {head: {eyes: true}},
  })
})
test('overwrites entire objects when target val is a simple string', t => {
  let res, origin, target
  origin = {
    body: 'a',
    body2: {head: false},
    tail: {}
  }
  target = 'a'
  res = merge(origin, target)
  t.is(res, 'a')
  t.deepEqual(origin, {
    body: 'a',
    body2: {head: false},
    tail: {}
  })
})
test('works with unlimited depth', t => {
  let res, origin, t1, t2, t3, t4
  const date = new Date()
  origin = {origin: 'a', t2: false, t3: {}, t4: 'false'}
  t1 = {t1: date}
  t2 = {t2: 'new'}
  t3 = {t3: 'new'}
  t4 = {t4: 'new', t3: {}}
  res = merge(origin, t1, t2, t3, t4)
  t.deepEqual(res, {origin: 'a', t1: date, t2: 'new', t3: {}, t4: 'new'})
  t.deepEqual(origin, {origin: 'a', t2: false, t3: {}, t4: 'false'})
  t.deepEqual(t1, {t1: date})
  t.deepEqual(t2, {t2: 'new'})
  t.deepEqual(t3, {t3: 'new'})
  t.deepEqual(t4, {t4: 'new', t3: {}})
})
