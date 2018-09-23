const Ajv = require('ajv')
const jsonfile = require('jsonfile')
const deepcopy = require('deepcopy')

class SchemaSettings {
  constructor({
    schema,
    location,
    readFile = jsonfile.readFileSync,
    writeFile = (f, d, o) => { return jsonfile.writeFileSync(f, d, {...o, ...{ spaces: 4 }}) },
    ajvArgs = {
      coerceTypes: true,
      useDefaults: true
    },
    hierarchySeparator = '.',
    arrayStartSeparator = '[',
    arrayEndSeparator = ']',
  }) {
    if (typeof schema !== 'object') {
      throw new Error(`invalid argument 'schema'`)
    }
    if (typeof location !== 'string') {
      throw new Error(`invalid argument 'location'`)
    }

    this._ajv = new Ajv(ajvArgs)
    this._validate = this._ajv.compile(schema)
    this._readFile = readFile
    this._writeFile = writeFile
    this._dataFile = location
    this._seps = {
      // hierarchy sep
      h: hierarchySeparator,
      // array seps
      a: {
        // start
        s: arrayStartSeparator,
        // end
        e: arrayEndSeparator
      }
    }
  }

  get(selector) {
    const data = this._readFile(this._dataFile)
    const valid = this._validate(data)
    
    if (valid) {
      return this.evaluateSelector(selector, data, 'reference')
    } else {
      throw new Error(this._ajv.errorsText(this._validate.errors))
    }
  }

  getTree(selector) {
    const data = this._readFile(this._dataFile)
    const valid = this._validate(data)
    
    if (valid) {
      return this.evaluateSelector(selector, data, 'copy')
    } else {
      throw new Error(this._ajv.errorsText(this._validate.errors))
    }
  }

  set(selectorOrData, data) {
    if (typeof data === 'undefined') {
      data = selectorOrData
      selectorOrData = undefined
    }

    let mutableTree = this.getTree()
    this.walkTree(selectorOrData, mutableTree, (ptr, key, i, keyCount) => {
      if (i === keyCount - 1) {
        ptr[key] = data
      }
    })

    const valid = this._validate(mutableTree)

    if (valid) {
      this._writeFile(this._dataFile, mutableTree)
    } else {
      throw new Error(this._ajv.errorsText(this._validate.errors))
    }
  }

  walkTree(selector, obj, cb) {
    const keys = selector
      .split(this._seps.h)
      .reduce((acc, sel) => {
        if (sel.indexOf(this._seps.a.s) !== -1) {
          const index = sel.substring(sel.indexOf(this._seps.a.s) + 1, sel.lastIndexOf(this._seps.a.e))
          const indexAsNumber = Number.parseInt(index)

          // this is key without the index
          const realKey = sel.substr(0, sel.indexOf(this._seps.a.s))

          return acc.concat([realKey, indexAsNumber])
        } else {
          return acc.concat([sel])
        }
      }, [])
        

    let ptr = obj

    keys.forEach((key, i) => {
      // exec
      cb(ptr, key, i, keys.length)

      // advance the ptr
      ptr = ptr[key]
    })
  }

  evaluateSelector(selector, obj, type = 'reference') {
    if (typeof selector === 'undefined') {
      return type === 'copy' ? deepcopy(obj) : obj
    }

    let ptr = obj
    let cpy = {}
    let cpyPtr = cpy

    let prevKey
    this.walkTree(selector, obj, (wptr, key, i, keyCount) => {
      if (type === 'copy') {
        cpyPtr[key] = (i == keyCount - 1) ? wptr[key] : Array.isArray(wptr[key]) ? [] : {}

        cpyPtr = cpyPtr[key]
      } else {
        ptr = wptr[key]
      }

      prevKey = key
    })

    return type === 'copy' ? cpy : ptr
  }

  generateSelectors(srcObject) {
    if (typeof srcObject === 'undefined') {
      // since we support empty object but expect defaults, we must make this an object for validate to fill
      srcObject = {}
    } else if (!Object.isExtensible(srcObject)) {
      srcObject = deepcopy(srcObject)
    }

    const valid = this._validate(srcObject)

    if (!valid) {
      throw new Error(this._ajv.errorsText(this._validate.errors))
    }
    
    const innerRecurse = (obj) => {
      const res = []
      if (typeof obj === 'object') {
        for (const prop in obj) {
          const val = obj[prop]

          if (typeof val === 'object' && !Array.isArray(val)) {
            res.push(...innerRecurse(val).map(v => `${prop}${this._seps.h}${v}`))
          } else if (Array.isArray(val)) {
            res.push(...val.reduce((acc, v, i) => acc.concat(innerRecurse(v).map(r => `${prop}${this._seps.a.s}${i}${this._seps.a.e}`), []), []))
          } else {
            res.push(prop)
          }
        }
      } else {
        res.push(obj)
      }

      return res
    }

    return innerRecurse(srcObject)
  }
}

module.exports = SchemaSettings

class Global {
  configure(args) {
    this._instance = new SchemaSettings(args)
  }

  get(selector) {
    return this._instance.get(selector)
  }

  getTree(selector) {
    return this._instance.getTree(selector)
  }

  walkTree(selector, obj, cb) {
    return this._instance.walkTree(selector, obj, cb)
  }

  evaluateSelector(selector, obj, type) {
    return this._instance.evaluateSelector(selector, obj, type)
  }

  generateSelectors(srcObject) {
    return this._instance.generateSelectors(srcObject)
  }
}

module.exports.global = new Global()