/**
 * Holds the state of the entire checkbox tree
 * with a unique key for every checkbox. Check/Uncheck
 * operations take time proportional to the total number
 * of affected nodes but setting each node takes constant time.
 */
 export interface CheckboxState {
  /**
   * The key string is of the form 'name-depth-index'
   * A helper function 'makeKey' has been defined to
   * generate consistent keys for you
   */
  [key:string]: {
    checked: boolean
    /**
     * An array of the key strings for the
     * child nodes. So that you can traverse
     * the tree when setting a node
     */
    children?: string[]
  }
}

/**
 * Required format to represent a checkbox in the UI
 */
export interface NestableCheckboxDetails {
  name: string;
  children?: NestableCheckboxDetails[];
}

/**
 * NestableCheckboxDetails with the checked key added
 */
export interface JsonDetails {
  checked: boolean;
  children?: JsonDetails[] | NestableCheckboxDetails[];
}

/**
 * Props for the InnerCheckbox. Allows for arbitrary depth
 * checkbox structures, but time complexity scales linearly
 * so extremely large structure may cause performance issues.
 * Inner state is actually used as a prop and controlled by the
 * wrapper component, but the name state is conceptually closer
 * to the property's intended usage.
 */
export interface InnerCheckboxProps extends NestableCheckboxDetails {
  depth: number;
  nodeIndex: number;
  state: CheckboxState;
  setState: (state: CheckboxState) => void;
}

/**
 * Checkbox details need additonal information in order to construct
 * the state object. Depth and index ensure uniqueness of keys and
 * name (in NestableCheckboxDetails) just makes debugging easier.
 */
export interface CheckboxStateBuilderNode extends NestableCheckboxDetails {
  depth: number;
  index: number;
}

/**
 * Props for the parent NestableCheckbox
 */
export interface NestableCheckboxProps {
  checkboxes: NestableCheckboxDetails[];
}

// Presentation types for Styled Components 

/**
 * Prop definition for styled components wrapper
 * Depth is required to set padding based on tree depth
 */
export interface CheckboxLayerProps {
  depth: number;
}