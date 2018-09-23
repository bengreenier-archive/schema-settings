const assert = require('assert')
const deepFreeze = require('deepfreeze')
const SS = require('../index')

const defaultSrc = deepFreeze({
  foo: 'hi mom',
  bar: 1,
  'it\'s': {
    me: true,
    arr: [
      1,
      2,
      3
    ],
    inner: {
      arr2: [
        'one',
        2,
        true
      ]
    }
  },
  tiger: {
    eye: 'of'
  }
})
const defaultSchema = {
  properties: {
    foo: { type: 'string', default: 'fooey' },
    bar: { type: 'number' },
    'it\'s': {
      type: 'object',
      properties: {
        me: { type: 'boolean' },
        arr: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        inner: {
          type: 'object',
          properties: {
            arr2: {
              type: 'array',
              items: {
                type: ['string', 'number', 'boolean']
              }
            }
          }
        }
      }
    },
    tiger: {
      type: 'object',
      properties: {
        eye: {type: 'string'}
      }
    }
  }
}
const generateInstance = (schema = defaultSchema, opts = {}) => {
  return new SS({...opts, ...{
    schema,
    location: './test-file.json'
  }})
}

describe('schema-settings', () => {
  describe('evaluateSelector', () => {
    it('should traverse simple selectors', () => {
      const instance = generateInstance()
      
      assert.equal(instance.evaluateSelector('foo', defaultSrc), defaultSrc['foo'])
    })

    it('should traverse complicated selectors', () => {
      const instance = generateInstance()
      
      assert.equal(instance.evaluateSelector('it\'s.me', defaultSrc), defaultSrc['it\'s']['me'])
    })

    it('should traverse array selectors', () => {
      const instance = generateInstance()
      
      assert.equal(instance.evaluateSelector('it\'s.arr[0]', defaultSrc), defaultSrc['it\'s']['arr'][0])
    })

    it('should traverse complicated array selectors', () => {
      const instance = generateInstance()
      
      assert.equal(instance.evaluateSelector('it\'s.inner.arr2[2]', defaultSrc), defaultSrc['it\'s']['inner']['arr2'][2])
    })

    it('should copy', () => {
      const instance = generateInstance()
      const actualResult = instance.evaluateSelector('it\'s.me', defaultSrc, 'copy')
      const expectedResult = {
        'it\'s': {
          me: defaultSrc['it\'s']['me']
        }
      }
      assert.deepEqual(actualResult, expectedResult)
      assert.notStrictEqual(actualResult, expectedResult)
    })
  })

  describe('getTree', () => {
    it('should result in a copy-tree', () => {
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc
      })
      
      assert.deepEqual(instance.getTree('it\'s.me'), {
        'it\'s': {
          me: defaultSrc['it\'s']['me']
        }
      })
    })

    it('should result in an array copy-tree', () => {
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc
      })
      
      assert.deepEqual(instance.getTree('it\'s.arr'), {
        'it\'s': {
          arr: defaultSrc['it\'s']['arr']
        }
      })
    })

    it('should result in an array copy-value', () => {
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc
      })
      
      assert.deepEqual(instance.getTree('it\'s.arr[1]'), {
        'it\'s': {
          arr: [,defaultSrc['it\'s']['arr'][1]]
        }
      })
    })
  })

  describe('get', () => {
    it('should result in a reference object', () => {
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc
      })
      
      assert.equal(instance.get('it\'s.me'), defaultSrc['it\'s']['me'])
    })

    it('should get default values', () => {
      const instance = generateInstance(defaultSchema, {
        readFile: () => ({})
      })
      
      assert.equal(instance.get('foo'), 'fooey')
    })
  })

  describe('set', () => {
    it('should write simple values', () => {
      let outputObject
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc,
        writeFile: (f, d, o) => outputObject = d 
      })

      instance.set('it\'s.me', false)
      assert.equal(outputObject['it\'s']['me'], false)
    })

    it('should write complex values', () => {
      let outputObject
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc,
        writeFile: (f, d, o) => outputObject = d 
      })

      instance.set('tiger', {eye: 'mine'})
      assert.equal(outputObject['tiger']['eye'], 'mine')
    })

    it('should write array values', () => {
      let outputObject
      const instance = generateInstance(defaultSchema, {
        readFile: () => defaultSrc,
        writeFile: (f, d, o) => outputObject = d 
      })
      
      instance.set('it\'s.arr[1]', 12)
      assert.equal(outputObject['it\'s']['arr'][1], 12)
    })

    it('should fail non-spec values', () => {
      assert.throws(() => {
        let outputObject
        const instance = generateInstance(defaultSchema, {
          readFile: () => defaultSrc,
          writeFile: (f, d, o) => outputObject = d 
        })
        
        instance.set('it\'s.arr[1]', 'i should be a number but i am not')
      })
    })
  })

  describe('generateSelectors', () => {
    it('should generate selectors for objects', () => {
      const instance = generateInstance()

      assert.deepEqual(instance.generateSelectors(defaultSrc), [
        'foo',
        'bar',
        'it\'s.me',
        'it\'s.arr[0]',
        'it\'s.arr[1]',
        'it\'s.arr[2]',
        'it\'s.inner.arr2[0]',
        'it\'s.inner.arr2[1]',
        'it\'s.inner.arr2[2]',
        'tiger.eye',
      ])
    })

    it('should generate for defaults', () => {
      const instance = generateInstance()

      assert.deepEqual(instance.generateSelectors(), [
        'foo'
      ])
    })
  })

  describe('global', () => {
    it('should reuse the same instance', () => {
      assert.throws(() => {
        SS.global.set('key', 'val')
      })

      SS.global.configure({
        schema: defaultSchema,
        location: './test-file.json'
      })

      assert.equal(SS.global.evaluateSelector('foo', defaultSrc), 'hi mom')
    })
  })
})