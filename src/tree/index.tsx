import React from "react";
import { Tree } from 'antd'

import type { TreeDataNode, TreeProps } from 'antd';
import { useTreeLink } from "react-combine-check";

const treeData = [
  {
    label: '0-0',
    value: '0-0',
    children: [
      {
        label: '0-0-0',
        value: '0-0-0',
        children: [
          { label: '0-0-0-0', value: '0-0-0-0' },
          { label: '0-0-0-1', value: '0-0-0-1' },
          { label: '0-0-0-2', value: '0-0-0-2' },
        ],
      },
      {
        label: '0-0-1',
        value: '0-0-1',
        children: [
          { label: '0-0-1-0', value: '0-0-1-0' },
          { label: '0-0-1-1', value: '0-0-1-1' },
          { label: '0-0-1-2', value: '0-0-1-2' },
        ],
      },
      {
        label: '0-0-2',
        value: '0-0-2',
      },
    ],
  },
  {
    label: '0-1',
    value: '0-1',
    children: [
      { label: '0-1-0-0', value: '0-1-0-0' },
      { label: '0-1-0-1', value: '0-1-0-1' },
      { label: '0-1-0-2', value: '0-1-0-2' },
    ],
  },
  {
    label: '0-2',
    value: '0-2',
  },
];

const App = () => {
  const { treeLink, checkedKeys, halfCheckedKeys, onInnerCheckedChange } =
  useTreeLink({
    tree: treeData || [],
  }) 

  const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
    const node = treeLink[info.node.key as string]
   
    onInnerCheckedChange({
      checked: info.checked,
      node: node,
    })
  }

  return (
    <Tree
      checkedKeys={{
        checked: checkedKeys,
        halfChecked: halfCheckedKeys
      }}
      checkable
      onCheck={(checkedInfo, info) => onCheck(checkedKeys, info)}
      treeData={treeData as any}
      fieldNames={{ children: 'children', title: 'label', key: 'value' }}
    />
  )
}

export default App