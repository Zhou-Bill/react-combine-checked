import React from "react";
import { Tree } from 'antd'

import type { TreeDataNode, TreeProps } from 'antd';
import { useTreeLink } from "react-combine-check";
import { getMoreData } from "react-combine-check/demo/demo";

const data =  getMoreData()


const App = () => {
  const { treeLink, checkedKeys, halfCheckedKeys, onInnerCheckedChange } =
  useTreeLink({
    tree: (data as any) || [],
    fieldNames: { children: 'children', label: 'label', value: 'value' }
  }) 
  console.log(Object.keys(treeLink))

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
      fieldNames={{ children: 'children', title: 'label', key: 'value' }}
      checkable
      onCheck={(checkedInfo, info) => onCheck(checkedKeys, info)}
      treeData={data as any}
    />
  )
}

export default App