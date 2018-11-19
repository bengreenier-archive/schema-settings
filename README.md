# schema-settings

[![Build Status](https://travis-ci.org/bengreenier/schema-settings.svg?branch=master)](https://travis-ci.org/bengreenier/schema-settings)

> __Deprecated.__ See [contributes](https://github.com/overlayed-app/contributes).

JSON Schema based settings provider :gear:

```
const SSettings = require('schema-settings')
const settings = new SSettings({
  schema: {
    properties: {
      foo: { type: 'string', default: 'bar' }
    }
  },
  location: `${__dirname}/settings.json`
})


const foo = settings.get('foo')

// prints 'bar'
console.log(foo)
```

I wanted a strongly constrained settings implementation that made it easy for folks to define additional setting constraints (as external plugins). I also wanted it to be easy to use. I think `schema-settings` does those things well.

## API

> First, install with `npm i schema-settings`

### global

A global [SchemaSettings](#schemasettings) instance, for use when you don't wish to maintain an instance.

This is designed for electron renderer process workloads, but may be broadly useful. Simply `configure` once
and then reference where needed. For example:

```
const settings = require('schema-settings`).global
settings.configure({
  schema: {
    properties: {
      todo: {type: 'string', default: 'populate this json schema constraints object' }
    }
  },
  location: './path-on-disk-to-save-settings-to.json'
})

// 'populate this json schema constraints object'
settings.get('todo')
```

### SchemaSettings

#### constructor

```
/**
* Creates an instance of SchemaSettings
* 
* By default, this uses coercion and defaults for the provided schema
* 
* @param ISchemaSettingsArgs Ctor args
*/
```

Arguments:

```
/**
* The ajv compatible JSONSchema definition
*/
schema : object,

/**
* The location of the settings data file
*/
location : string,

/**
* A readFile implementation
*/
readFile ?: readFileSync,

/**
* A writeFile implementation
*/
writeFile ?: writeFileSync,

/**
* The ajv compilation arguments
*/
ajvArgs ?: Options,

/**
* The separator used to denote object hierarchy in selectors
*/
hierarchySeparator ?: string,

/**
* The separator used to denote the start of array indices in selectors
*/
arrayStartSeparator ?: string,

/**
* The separator used to denote the end of array indices in selectors
*/
arrayEndSeparator ?: string
```

Example:

```
const SS = require('schema-settings`)
const settings = new SS({
  schema: {
    properties: {
      todo: {type: 'string', default: 'populate this json schema constraints object' }
    }
  },
  location: './path-on-disk-to-save-settings-to.json'
})
```

#### get

```
/**
* Get's all or a portion of the settings
* @param selector sub object selector
*/
```

Arguments:

```
/**
* sub object selector used to determine what portion of the settings object you demand
* Optional
*/
selector ?: string
```

Example:

```
const todo = settings.get('todo')

// outputs 'populate this json schema constraints object'
console.log(todo)
```

#### getTree

> Designed for internal use only

```
/**
* Get's a portion of settings, maintaining the object tree leading to that portion
* @param selector sub object selector
*/
```

Arguments:

```
/**
* sub object selector used to determine what portion of the settings object you demand
* Optional
*/
selector ?: string
```

Example:

```
const todoTree = settings.getTree('todo')

// outputs {todo: 'populate this json schema constraints object'}
console.log(todoTree)
```

#### set

```
/**
* Set's a portion of the settings
* @param selector sub object selector
* @param val value to store
*/
```

Arguments:

```
/**
* sub object selector used to determine what portion of the settings object you wish to change
* Optional
*/
selector ?: string

/**
* The value you wish to set for settings
* Note: If you omit the selector argument, this argument will be first
*/
val : object
```

Example:

```
// will write a new value for 'todo'
settings.set('todo', 'i\'ve done it now!')
```

#### walkTree

> Designed for internal use only

```
/**
* Walks toward a selector against a given object and calls callback for each step
* @param selector sub object selector
* @param obj object
* @param cb step callback, given (obj ptr, selector part, selector part index, total selector parts count)
*/
```

Arguments:

```
/**
* sub object selector used to determine what portion of the settings object you wish to walk toward
*/
selector : string

/**
* The object you wish to walk over
*/
obj : object

/**
* The callback that will be invoked for each step
* it's given:
*    obj: a pointer to the node in the object we are currently walking on
*    key: the key that we are about to walk into
*    index: the index of the key, as a part of the overall selector
*    keyCount: the number of total keys that makeup the overall selector
*/
cb : (obj : object, key : string, index : number, keyCount : number)
```

#### evaluateSelector

```
/**
* Evaluates a selector against a given object and returns the selected bits
* @param selector sub object selector
* @param obj object
* @param type the evaluation type we use (copy-tree, or reference src object)
*/
```

Arguments:

```
/**
* sub object selector used to determine what portion of the settings object you wish to walk toward
*/
selector : string

/**
* The object you wish to walk over
*/
obj : object

/**
* The evaluation type we use ('reference' or 'copy')
* This determines if we reference a part of the larger object in the return type
* or if we copy the object/relevant bits to it's own structure
*/
type : 'reference' | 'copy' = 'reference'
```

#### generateSelectors

```
/**
* Generates selectors for a given object shape
* @param srcObject object for which to generate selectors
*/
```

Arguments:

```
/**
* The object you wish to generate selectors for
*/
srcObject : object
```

Example:

```
const selectors = settings.generateSelectors({todo: 'hello'})

// outputs ['todo']
console.log(selectors)
```

## License

MIT
