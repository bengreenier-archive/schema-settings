declare module 'schema-settings' {
  import {Options} from 'ajv'
  import {readFileSync, writeFileSync} from 'jsonfile'

  interface ISchemaSettingsArgs {
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
  }

  interface ISchemaSettings {
    /**
     * Get's all or a portion of the settings
     * @param selector sub object selector
     */
    get(selector ?: string) : object

    /**
     * Get's a portion of settings, maintaining the object tree leading to that portion
     * @param selector sub object selector
     */
    getTree(selector ?: string) : object

    /**
     * Set's a portion of the settings
     * @param selector sub object selector
     * @param val value to store
     */
    set(selector : string, val : object) : void

    /**
     * Set's all of the settings
     * @param selector sub object selector
     */
    set(val : object) : void

    /**
     * Walks toward a selector against a given object and calls callback for each step
     * @param selector sub object selector
     * @param obj object
     * @param cb step callback, given (obj ptr, selector part, selector part index, total selector parts count)
     */
    walkTree(selector, obj, cb)

    /**
     * Evaluates a selector against a given object and returns the selected bits
     * @param selector sub object selector
     * @param obj object
     * @param type the evaluation type we use (copy-tree, or reference src object)
     */
    evaluateSelector(selector : string, obj : object, type : 'reference' | 'copy' = 'reference') : object

    /**
     * Generates selectors for a given object shape
     * @param srcObject object for which to generate selectors
     */
    generateSelectors(srcObject : object) : string[]
  }

  /**
   * JSONSchema strong settings
   */
  export class SchemaSettings implements ISchemaSettings {
    /**
     * Creates an instance of SchemaSettings
     * 
     * By default, this uses coercion and defaults for the provided schema
     * 
     * @param ISchemaSettingsArgs Ctor args
     */
    constructor(ISchemaSettingsArgs)
  }

  export const global : ISchemaSettings & {configure: (args: ISchemaSettingsArgs) => void}
}