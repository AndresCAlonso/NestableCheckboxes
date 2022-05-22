import { ReactElement, useState } from 'react'
import styled from 'styled-components'
import {
    CheckboxLayerProps,
    CheckboxState,
    CheckboxStateBuilderNode,
    InnerCheckboxProps,
    JsonDetails,
    NestableCheckboxDetails,
    NestableCheckboxProps,
} from '../types/NestableCheckboxTypes'

/**
 * Helper function to generate a state key for a checkbox
 * Parameters are names and should be passed in an object
 *
 * @param keyInfo Object containing the info needed to make the key
 * @param keyInfo.depth the depth of the checkbox in the tree (starts with 1 for top level)
 * @param keyInfo.index the index of the node in its particular layer (starts a 0)
 * @param keyInfo.name the name (label) of the checkbox
 *
 * @returns a string of the form <name>-<depth>-<index>
 */
const makeKey = ({
    depth,
    index,
    name,
}: {
    depth: number
    index: number
    name: string
}) => [name, depth, index].join('-')

/**
 * Take the checkboxState and a tree traversal stack
 * pops a node off the stack, constructs the state object
 * associated with it, adds it to the running state object,
 * and pushes its children on the stack for processing
 *
 * @param checkboxState the running checkboxState as its being constructed initially
 * @param nodeStack the stack of nodes left to process and explore
 */
const updateNodeState = (
    checkboxState: CheckboxState,
    nodeStack: CheckboxStateBuilderNode[]
) => {
    const node = nodeStack.pop()
    if (typeof node != 'undefined') {
        const { name, depth, children, index } = node
        const key = makeKey({ name, depth, index })
        const hasChildren = children && children.length > 0

        if (hasChildren) {
            children.forEach((child: NestableCheckboxDetails, idx: number) =>
                nodeStack.push({ ...child, index: idx, depth: depth + 1 })
            )
        }

        checkboxState[key] = {
            checked: false,
            ...(hasChildren
                ? {
                      children: children.map(({ name }, idx) =>
                          makeKey({ name, depth: depth + 1, index: idx })
                      ),
                  }
                : undefined),
        }
    }
}

/**
 * Performs a depth-first traversal of the checkboxes to construct
 * the initial state object. Initializes boxes to be unchecked,
 * but can easily be modified to handle initial state
 *
 * @param checkboxItems the checkbox details passed to the parent
 *
 * @returns A state object described in the CheckboxState type
 */
const constructState = (
    checkboxItems: NestableCheckboxDetails[]
): CheckboxState => {
    const nodeStack: CheckboxStateBuilderNode[] = []
    checkboxItems.forEach((node, index) =>
        nodeStack.push({ ...node, depth: 1, index })
    )

    const state = {}
    while (nodeStack.length > 0) {
        updateNodeState(state, nodeStack)
    }

    return state
}

/**
 * Looks up a node based on the targetNodeKey and sets
 * it and all its children to the toSet value. toSet is not
 * technically necessary but we already had the value so it is passed.
 * It can be made optional or removed easily.
 *
 * @param setDetails parent object with the named parameters
 * @param setDetails.currentState current checkbox state before making changes
 * @param setDetails.targetNodeKey key of the root node for the change
 * @param setDetails.toSet value to set node and all descendants
 *
 * @returns the updated state
 */
const setCheckboxTree = ({
    currentState,
    targetNodeKey,
    toSet,
}: {
    currentState: CheckboxState
    targetNodeKey: string
    toSet: boolean
}): CheckboxState => {
    const checkboxNode = currentState?.[targetNodeKey]

    if (checkboxNode) {
        const keyStack: string[] = []
        const newNodes: CheckboxState = {}

        keyStack.push(targetNodeKey)
        while (keyStack.length > 0) {
            const key = keyStack.pop() ?? ''
            const node = currentState?.[key]

            newNodes[key] = { ...node, checked: toSet }
            const children = node?.children

            if (children && children.length > 0) {
                children.forEach((nodeKey) => keyStack.push(nodeKey))
            }
        }

        return { ...currentState, ...newNodes }
    }

    return currentState
}

/**
 * The checkbox component that can be nested to any arbitrary depth
 *
 * @param InnerCheckboxProps see the type definition for details
 *
 * @returns the inner checkbox react component
 */
const InnerCheckbox = ({
    children,
    depth,
    name,
    nodeIndex,
    state,
    setState,
}: InnerCheckboxProps): ReactElement => {
    const nodeKey = makeKey({ name, depth, index: nodeIndex })
    const nodeState = state?.[nodeKey]
    const checked = nodeState?.checked ?? false

    return (
        <CheckboxLayerWrapper depth={depth}>
            <CheckboxDisplay>
                <Checkbox
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                        setState(
                            setCheckboxTree({
                                currentState: state,
                                targetNodeKey: nodeKey,
                                toSet: !checked,
                            })
                        )
                    }
                />
                <CheckboxLabel>{name}</CheckboxLabel>
            </CheckboxDisplay>
            {children && children.length > 0
                ? children.map(({ name, children }, idx) => {
                      return (
                          <InnerCheckbox
                              name={name}
                              children={children}
                              depth={depth + 1}
                              key={makeKey({ name, index: idx, depth })}
                              state={state}
                              setState={setState}
                              nodeIndex={idx}
                          />
                      )
                  })
                : undefined}
        </CheckboxLayerWrapper>
    )
}

/**
 * Looks up the check state for the particular checkbox and enriches the object with it
 * also recursively updates its children in the same manner. Uses map and avoids modifying
 * the original object
 *
 * @param checkboxSettings
 * @param checkboxSettings.checkboxDetails checkbox information without the checked flag
 * @param checkboxSettings.currentState the checkbox group state
 * @param checkboxSettings.depth current depth in the tree (1-based)
 * @param checkboxSettings.index index at current level (0-based)
 * @returns
 */
const enrichCheckboxDetails = ({
    checkboxDetails,
    currentState,
    depth,
    index,
}: {
    checkboxDetails: NestableCheckboxDetails
    currentState: CheckboxState
    depth: number
    index: number
}): JsonDetails => {
    const stateKey = makeKey({ depth, index, name: checkboxDetails?.name })
    const checked = currentState?.[stateKey]?.checked ?? false
    const children = checkboxDetails?.children

    return {
        ...checkboxDetails,
        checked,
        ...(children && children.length > 0
            ? {
                  children: children.map((child, idx) =>
                      enrichCheckboxDetails({
                          checkboxDetails: child,
                          currentState,
                          depth: depth + 1,
                          index: idx,
                      })
                  ),
              }
            : undefined),
    }
}

/**
 * Returns a JSON representation of the checkboxes in their current state
 *
 * @param checkboxes The checkbox details that represent the checkbox group
 * @param currentState The current state of all the checkboxes
 * @returns
 */
const getCheckboxJSON = (
    checkboxes: NestableCheckboxDetails[],
    currentState: CheckboxState
): string => {
    return JSON.stringify(
        checkboxes.map((checkboxDetails, index) =>
            enrichCheckboxDetails({
                checkboxDetails,
                currentState,
                depth: 1,
                index,
            })
        )
    )
}

/**
 * The parent NestableCheckbox component that holds the state for
 * the entire tree
 *
 * @param NestableCheckboxProps see type definition
 *
 * @returns the NestableCheckbox component meant to be used in the UI
 */
export const NestableCheckbox = ({
    checkboxes,
}: NestableCheckboxProps): ReactElement => {
    const [state, setState] = useState(constructState(checkboxes))

    return (
        <Wrapper>
            {checkboxes.map(
                ({ name, children }: NestableCheckboxDetails, idx: number) => {
                    return (
                        <InnerCheckbox
                            children={children}
                            depth={1}
                            key={makeKey({ name, index: idx, depth: 0 })}
                            name={name}
                            nodeIndex={idx}
                            state={state}
                            setState={setState}
                        />
                    )
                }
            )}
            <ExportButton
                onClick={() =>
                    navigator?.clipboard?.writeText(
                        getCheckboxJSON(checkboxes, state)
                    )
                }
            >
                Copy JSON to Clipboard
            </ExportButton>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    padding: 16px;
    font-size: ${24 / 16}rem;
    line-height: ${30 / 16}rem;
    font-family: Helvetica, sans-serif;
    display: flex;
    flex-direction: column;
    max-width: fit-content;
`

const CheckboxDisplay = styled.div`
    display: flex;
    align-items: baseline;
`

const CheckboxLayerWrapper = styled.div<CheckboxLayerProps>`
    padding-left: ${(p) => p.depth * 8}px;
    padding-right: 8px;
`

const ExportButton = styled.button`
    align-self: flex-end;
    background-color: hsl(200, 60%, 50%);
    padding: 10px 16px 8px 16px;
    color: white;
    border-radius: 4px;
    border: none;
    font-weight: 600;
    margin-top: 16px;

    &:hover {
        background-color: hsl(220, 50%, 50%);
    }
`

// TODO: Add styles
const CheckboxLabel = styled.label``
const Checkbox = styled.input``
