import { difference } from 'lodash-es'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export type TreeType = {
  label: string
  value: string | number
  children?: TreeType[]
  disabled?: boolean
  _origin?: {
    [key in string]: any
  }
} & {
  [key in string]: any
}

type TreeLinkType = {
  /** 当前节点类型 */
  node: TreeType & {
    disabled?: boolean
  }
  children: {
    node: TreeLinkType['node']
  }[]
  /** 第几层 */
  level: number
  /** 父亲节点id， 已value 为主 */
  parentId?: string | number | null
  /** 父亲节点 */
  parentNode: TreeLinkType['node'] | null
  /** 记录下父级节点是不是一直disabled */
  parentDisabled?: boolean
}

type CheckedEvent = {
  /** 是否勾选 */
  checked: boolean
  /** 当前勾选的节点 */
  node: TreeLinkType
}
type Key = string | number

type ParamsType = {
  tree: TreeType[]
  value?: {
    checkedKeys: Array<Key>
    halfCheckedKeys: Array<Key>
  }
  onChange?: (value: NonNullable<ParamsType['value']>) => void
  /** 全选时阻止传导，当父级节点为disabled 的时候 不会传导下级勾选， 反 */
  isBlockConductionWhenDisabled?: boolean
  /**
   * @default { label: 'label', value: 'value', children: 'children' }
   * 自定义字段名
   */
  fieldNames?: {
    label: string,
    value: string
    children: string
  }
}

export function isCheckDisabled(node: TreeLinkType['node']) {
  const { disabled } = (node || {}) as TreeLinkType['node']
  return disabled ?? false
}

const useTreeLink = (params: ParamsType) => {
  const { 
    tree, 
    value, 
    isBlockConductionWhenDisabled = true, 
    fieldNames = {children: 'children', value: 'value', label: 'label' }, 
    onChange 
  } = params

  /** 当前tree 转成map, 它是一个树，链接着他的父亲与儿子们 */
  const [treeLink, setTreeLink] = useState<Record<string, TreeLinkType>>({})
  /** 已勾选的key */
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([])
  /** 半选key */
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<Key[]>([])
  // const isMounted = React.useRef(false)

  /** 真实的勾选数据 */
  const trueCheckedData = useRef<ParamsType['value']>({
    checkedKeys: [],
    halfCheckedKeys: [],
  })

  useEffect(() => {
    if (!tree || tree.length === 0) {
      return
    }
    function init() {
      const result: Record<string, TreeLinkType> = {}
      let maxLevel = 0
      /**
       * 递归treeData, 放入一个map中, 已value 可以key
       *
       */
      const deepFlatTreeData = (
        data: TreeType[],
        level: number,
        parentId: string | number | null,
        /** 如果父级节点是disabled，那么它应该也是disabled */
        disabled: boolean,
      ) => {
        data.forEach((_item, index) => {
          const parentNode = parentId ? result[parentId].node : null
          const childrenNode = _item.children?.map((_child) => {
            return {
              // ..._child,
              node: {
                ..._child,
                disabled: (_child?.disabled ?? false),
                parentDisabled: (_child?.disabled ?? false) || disabled || (_item?.disabled ?? false),
              },
            }
          })
          result[_item[(fieldNames.value) as 'value']] = {
            node: {
              ..._item,
              disabled: _item?.disabled ?? false,
            },
            children: childrenNode || [],
            level,
            parentId,
            parentNode: parentNode,
            parentDisabled: (_item.disabled ?? false) || disabled,
          }
          maxLevel = level
          if (_item.children && _item.children!.length > 0) {
            deepFlatTreeData(_item.children!, level + 1, _item[(fieldNames.value) as 'value'], (_item.disabled ?? false) || disabled)
          }
        })
      }
      deepFlatTreeData(tree, 0, null, false)
      return {
        treeLink: result,
        maxLevel: maxLevel,
      }
    }
    const result = init()
    setTreeLink(result.treeLink)
   
  }, [tree])

  useEffect(() => {
    if (!value || Object.keys(treeLink).length === 0) {
      return
    }
    const { checkedKeys, halfCheckedKeys } = value
    if (checkedKeys?.length === 0 && halfCheckedKeys?.length === 0) {
      setCheckedKeys([])
      setHalfCheckedKeys([])
      return
    }

    if (
      difference(checkedKeys, trueCheckedData.current!.checkedKeys).length === 0
    ) {
      return
    }

    const result = conductCheckTrue(checkedKeys)

    setCheckedKeys(result.checkedKeys as string[])
    setHalfCheckedKeys(result.halfCheckedKeys as string[])
    trueCheckedData.current = result
    onChange?.(result)
  }, [value, treeLink])

  /** 将当前的tree，用level 去分层, key 作为level 层数 */
  const levelTree = useMemo(() => {
    const levelEntities = new Map<number, Set<TreeLinkType>>()
    let maxLevel = 0

    Object.keys(treeLink).forEach((key) => {
      const entity = treeLink[key]
      const { level } = entity

      let levelSet: Set<TreeLinkType> = levelEntities.get(
        level,
      ) as Set<TreeLinkType>

      if (!levelSet) {
        levelSet = new Set()
        /** 保存层数节点 */
        levelEntities.set(level, levelSet)
      }

      levelSet.add(entity)

      maxLevel = Math.max(maxLevel, level)
    })
    return {
      maxLevel,
      levelEntities,
    }
  }, [treeLink])

  const onInnerCheckedChange = (event: CheckedEvent) => {
    const result = getLatestCheckedKeys(event)
    trueCheckedData.current = result
    setCheckedKeys(result.checkedKeys as string[])
    setHalfCheckedKeys(result.halfCheckedKeys as string[])
    if (onChange) {
      onChange(result)
    }
  }

  /**
   * 点击时会首先 从上而下勾选他的子节点， 然后从下而上勾选他的父节点（如果满足条件的话）
   * 反选一样，
   * 因为这里有半选状态，父节点有n个节点时，当只勾选一个节点的时候，直接点击父节点会全选，不存在半选状态下直接反选节点
   */
  const getLatestCheckedKeys = (event: CheckedEvent) => {
    const { node, checked } = event
    const key = node.node[(fieldNames.value) as 'value']
    let result = null
    if (checked) {
      result = conductCheckTrue([...checkedKeys, key])
    } else {
      const deletedCheckedKeys = checkedKeys.filter(
        (_item) => _item !== node.node[(fieldNames.value) as 'value'],
      )
      result = conductCheckFalse(deletedCheckedKeys, halfCheckedKeys)
    }
    return result
  }

  /**
   * 勾选情况下
   * @param keyList 当前选中的key
   * @param treeLink 向前树的链表
   */
  const conductCheckTrue = (
    keyList: Array<Key>,
    // treeLink: Record<string, TreeLinkType>,
  ) => {
    /** 过滤掉 checkedkeys 中在 treeLink 下不存在的值 */
    const keys = new Set<Key>(
      keyList.filter((_item) => {
        return typeof treeLink[_item] !== undefined
      }),
    )
    const currentCheckedKeys = new Set<Key>(keys)

    const currentHalfCheckedKeys = new Set<Key>()

    /** 从最顶层开始遍历，遍历每一层的节点，如果在 checkedKey 里面的就勾选他的子级 */
    for (let level = 0; level <= levelTree.maxLevel; level += 1) {
      const entities = levelTree.levelEntities.get(level) || new Set()
      entities.forEach((entity) => {
        const { node, children = [] } = entity

        if (currentCheckedKeys.has(node[(fieldNames.value) as 'value']) && !isCheckDisabled(node)) {
          children
            .filter((childEntity) => !isCheckDisabled(childEntity.node))
            .forEach((childEntity) => {
              currentCheckedKeys.add(childEntity.node[(fieldNames.value) as 'value'])
            })
        }
      })
    }

    /** 记录已经遍历的值，因为要从最底层往上遍历，
     * 当父级节点下的所有子集都勾选的情况下，需要勾选他的父级，否则处于半选状态或者是未勾选状态
     *  */
    const visitedKeys = new Set<Key>()
    for (let level = levelTree.maxLevel; level >= 0; level -= 1) {
      const entities = levelTree.levelEntities.get(level) || new Set()
      entities.forEach((entity) => {
        const { parentNode, node } = entity

        /* 如果没有上级节点，或者上级节点已经遍历过的，或者当前节点不能勾选，则退出 */
        if (
          isCheckDisabled(node) ||
          !parentNode ||
          visitedKeys.has(parentNode[(fieldNames.value) as 'value'])
        ) {
          return
        }

        // 如果上级节点不能勾选
        if (isCheckDisabled(parentNode)) {
          visitedKeys.add(parentNode[(fieldNames.value) as 'value'])
          return
        }

        let allChecked = true
        /** 记录半选 */
        let partialChecked = false

        /** 如果父级节点下的children 都被勾选了，那么表示父级节点也应该加到checkedKey, 否则加入到半选 */
        ;(parentNode.children || [])
          .filter((childEntity) => !isCheckDisabled(childEntity))
          .forEach((_child) => {
            const value = _child[fieldNames.value as 'value']
            const checked = currentCheckedKeys.has(value)
            /** 当前有一个子节点没被勾选，表示父亲下的儿子没有被全选，父亲不应加入checkedKey */
            if (allChecked && !checked) {
              allChecked = false
            }
            if (
              !partialChecked &&
              (checked || currentHalfCheckedKeys.has(value))
            ) {
              partialChecked = true
            }
          })

        if (allChecked) {
          currentCheckedKeys.add(parentNode[(fieldNames.value) as 'value'])
        }
        if (partialChecked) {
          currentHalfCheckedKeys.add(parentNode[(fieldNames.value) as 'value'])
        }

        visitedKeys.add(parentNode[(fieldNames.value) as 'value'])
      })
    }

    return {
      checkedKeys: Array.from(currentCheckedKeys),
      halfCheckedKeys: Array.from(
        removeFromCheckedKeys(currentHalfCheckedKeys, currentCheckedKeys),
      ),
    }
  }

  const conductCheckFalse = (keys: Array<Key>, halfKeys: Key[]) => {
    const checkedKeys = new Set<Key>(keys)
    let halfCheckedKeys = new Set<Key>(halfKeys)

    // 从上到下 清空子节点
    for (let level = 0; level <= levelTree.maxLevel; level += 1) {
      const entities = levelTree.levelEntities.get(level) || new Set()
      entities.forEach((entity) => {
        const { node, children = [] } = entity

        /** 如果当前节点没有勾选，且没有在半选下，那么他的子级应该被清空 */
        if (
          !checkedKeys.has(node[(fieldNames.value) as 'value']) &&
          !halfCheckedKeys.has(node[(fieldNames.value) as 'value']) &&
          !isCheckDisabled(node)
        ) {
          children
            .filter((childEntity) => !isCheckDisabled(childEntity.node))
            .forEach((childEntity) => {
              checkedKeys.delete(childEntity.node[(fieldNames.value) as 'value'])
            })
        }
      })
    }

    // 从下到上清空节点，
    halfCheckedKeys = new Set<Key>()
    const visitedKeys = new Set<Key>()
    for (let level = levelTree.maxLevel; level >= 0; level -= 1) {
      const entities = levelTree.levelEntities.get(level) || new Set()

      entities.forEach((entity) => {
        const { parentNode, node } = entity

        /* 如果没有上级节点，或者上级节点已经遍历过的，或者当前节点不能勾选，则退出 */
        if (
          isCheckDisabled(node) ||
          !parentNode ||
          visitedKeys.has(parentNode[(fieldNames.value) as 'value'])
        ) {
          return
        }

        if (isCheckDisabled(parentNode)) {
          visitedKeys.add(parentNode[(fieldNames.value) as 'value'])
          return
        }

        let allChecked = true
        let partialChecked = false

        ;(parentNode.children || [])
          .filter((childEntity) => !isCheckDisabled(childEntity))
          .forEach((_child) => {
            const value = _child[(fieldNames.value) as 'value']
            const checked = checkedKeys.has(value)
            if (allChecked && !checked) {
              allChecked = false
            }
            if (!partialChecked && (checked || halfCheckedKeys.has(value))) {
              partialChecked = true
            }
          })

        if (!allChecked) {
          checkedKeys.delete(parentNode[(fieldNames.value) as 'value'])
        }
        if (partialChecked) {
          halfCheckedKeys.add(parentNode[(fieldNames.value) as 'value'])
        }

        visitedKeys.add(parentNode[(fieldNames.value) as 'value'])
      })
    }

    return {
      checkedKeys: Array.from(checkedKeys),
      halfCheckedKeys: Array.from(
        removeFromCheckedKeys(halfCheckedKeys, checkedKeys),
      ),
    }
  }

  /** 从半选中删掉已选 */
  function removeFromCheckedKeys(
    halfCheckedKeys: Set<Key>,
    checkedKeys: Set<Key>,
  ) {
    const filteredKeys = new Set<Key>()
    halfCheckedKeys.forEach((key) => {
      if (!checkedKeys.has(key)) {
        filteredKeys.add(key)
      }
    })
    return filteredKeys
  }

  const canCheckedTreeKeys = useMemo(() => {
    const tempData = Object.keys(treeLink).filter((_item) => {
      return isBlockConductionWhenDisabled ? !treeLink[_item].parentDisabled : !treeLink[_item].node.disabled
    })
    return tempData
  }, [treeLink, isBlockConductionWhenDisabled])

  const isCheckAll = useMemo(() => {
    return checkedKeys.length >= canCheckedTreeKeys.length
  }, [canCheckedTreeKeys, checkedKeys])

  /** 半选状态 */
  const checkAllIsIndeterminate = useMemo(() => {
    return (halfCheckedKeys.length > 0 || checkedKeys.length > 0) && !isCheckAll
  }, [isCheckAll, checkedKeys, halfCheckedKeys])

   /** 勾选所有可以勾选的 */
  const onCheckAllChange = () => {
    // 如果是全选状态 并且不是半选，那么就是反选
    const checked = isCheckAll && checkAllIsIndeterminate ? false : true
    if (isBlockConductionWhenDisabled) {
      /** 拿第一层 */
      const firstFloor = levelTree.levelEntities.get(0)
      if (!firstFloor) {
        return
      }
      /** 第一层开始向下勾选可以勾选的值 */
      const changeKeys: Array<number | string> = []
      const changeHalfKeys: Array<number | string> = []

      let checkedKeysAndDisabled: Array<number | string> = []

      Object.keys(treeLink).forEach((_item) => {
        if (isCheckDisabled(treeLink[_item].node)) {
          if (checkedKeys.includes(treeLink[_item].node.value)) {
            checkedKeysAndDisabled.push(treeLink[_item].node.value)
          }
          return
        }
      })

      firstFloor.forEach((entity) => {
        if (isCheckDisabled(entity.node)) {
          return
        }
        const result = getLatestCheckedKeys({
          checked: checked,
          node: entity,
        })
        changeKeys.push(...result.checkedKeys)
        changeHalfKeys.push(...result.halfCheckedKeys)
      })

      const formattedCheckedKeys = Array.from(new Set(changeKeys))
      const formattedHalfCheckedKeys = Array.from(new Set(changeHalfKeys))

      const diffedKeys = checkAllIsIndeterminate ? formattedCheckedKeys : difference(formattedCheckedKeys, checkedKeys) 
      const diffedHalfKeys = checkAllIsIndeterminate ? formattedHalfCheckedKeys : difference(formattedHalfCheckedKeys, halfCheckedKeys)

      const latestCheckedKeys = Array.from(new Set([...checkedKeysAndDisabled, ...diffedKeys]))

      trueCheckedData.current = {
        checkedKeys: latestCheckedKeys,
        halfCheckedKeys: diffedHalfKeys,
      }

      setCheckedKeys(latestCheckedKeys as string[])
      setHalfCheckedKeys(diffedHalfKeys as string[])
      if (onChange) {
        onChange(trueCheckedData.current)
      }
    } else {
      // 尽可能拿可以勾选的，遍历treelink
      let changeKeys: Array<number | string> = []
      let checkedKeysAndDisabled: Array<number | string> = []
      Object.keys(treeLink).forEach((_item) => {
        if (isCheckDisabled(treeLink[_item].node)) {
          if (checkedKeys.includes(treeLink[_item].node.value)) {
            checkedKeysAndDisabled.push(treeLink[_item].node.value)
          }
          return
        }
        changeKeys.push(treeLink[_item].node.value)
      })
      const diffedKeys = checkAllIsIndeterminate ? changeKeys : difference(changeKeys, checkedKeys)
      const latestCheckedKeys = Array.from(new Set([...checkedKeysAndDisabled, ...diffedKeys]))

      let changeHalfKeys: Array<number | string> = []
      latestCheckedKeys.forEach((_item) => {
        const node = treeLink[_item]
        if (!changeHalfKeys.includes(node.parentId as string)) {
          changeHalfKeys.push(node.parentId as string)
        }
      })
      trueCheckedData.current = {
        checkedKeys: latestCheckedKeys,
        halfCheckedKeys: changeHalfKeys,
      }
      setCheckedKeys(latestCheckedKeys as string[])
      setHalfCheckedKeys([] as string[])
      if (onChange) {
        onChange(trueCheckedData.current)
      }
    }
  }

  return {
    checkAllIsIndeterminate,
    isCheckAll,
    treeLink,
    levelTree,
    checkedKeys,
    halfCheckedKeys,
    trueCheckedData,
    onInnerCheckedChange,
    removeFromCheckedKeys,
    getLatestCheckedKeys,
    setCheckedKeys,
    setHalfCheckedKeys,
    onCheckAllChange,
  }
}

export default useTreeLink
