import React from "react";
import { Tree } from 'antd'

import type { TreeDataNode, TreeProps } from 'antd';
import { useTreeLink } from "react-combine-check";

const treeData = [
  {
    title: '0-0',
    key: '0-0',
    children: [
      {
        title: '0-0-0',
        key: '0-0-0',
        children: [
          { title: '0-0-0-0', key: '0-0-0-0' },
          { title: '0-0-0-1', key: '0-0-0-1' },
          { title: '0-0-0-2', key: '0-0-0-2' },
        ],
      },
      {
        title: '0-0-1',
        key: '0-0-1',
        children: [
          { title: '0-0-1-0', key: '0-0-1-0' },
          { title: '0-0-1-1', key: '0-0-1-1' },
          { title: '0-0-1-2', key: '0-0-1-2' },
        ],
      },
      {
        title: '0-0-2',
        key: '0-0-2',
      },
    ],
  },
  {
    title: '0-1',
    key: '0-1',
    children: [
      { title: '0-1-0-0', key: '0-1-0-0', children: [
        { title: '0-1-0-0-0', key: '0-1-0-0-0' },
        { title: '0-1-0-0-1', key: '0-1-0-0-1' },
      ] },
      { title: '0-1-0-1', key: '0-1-0-1',
        children: [
          { title: '0-1-0-1-0', key: '0-1-0-1-0' },
          { title: '0-1-0-1-1', key: '0-1-0-1-1' },
        ]
      },
      { title: '0-1-0-2', key: '0-1-0-2' },
    ],
  },
  {
    title: '0-2',
    key: '0-2',
  },
];

const App = () => {
  const { treeLink, checkedKeys, halfCheckedKeys, onInnerCheckedChange } =
  useTreeLink({
    tree: (treeData as any) || [],
    fieldNames: { children: 'children', label: 'title', value: 'key' }
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
    />
  )
}

export default App