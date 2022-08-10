import React from 'react';
import type { Meta } from '@storybook/react';

import { asyncConfirm, AsyncModalEvents, asyncModalify, AsyncModalifyFC } from '.';
import { Button, Space } from 'antd';

import './index.less';

export function Basics() {
  type DemoProps = {
    id: string;
  };

  const api = async () => 'api成功';

  const Demo2: AsyncModalifyFC<DemoProps, string> = ({ emitter }) => {
    // 如果需要和modal的按钮交互，可以通过emitter on方法，并可返回Promise，或取消按钮行为
    emitter?.on(AsyncModalEvents.ok, async () => 'emitter.on(ok)成功');

    return <>点击确定按钮提交值</>;
  };

  const Demo3: AsyncModalifyFC<DemoProps, string> = ({ emitter }) => {
    // 阻止弹出框关闭
    emitter?.on(AsyncModalEvents.ok, () =>
      Promise.reject(new Error('校验不通过，不能正常提交关闭')),
    );

    return <>点击确定按钮阻止了关闭</>;
  };

  const Demo4: AsyncModalifyFC<DemoProps, string> = ({ emitter }) => {
    // 返回异步接口的值
    emitter?.on(AsyncModalEvents.ok, () => {
      return api();
    });

    return <>点击确定通过接口返回异步值</>;
  };

  const AsyncDemoModal2 = asyncModalify(Demo2, { closable: true });
  const AsyncDemoModal3 = asyncModalify(Demo3, { closable: true });
  const AsyncDemoModal4 = asyncModalify(Demo4, { closable: true });

  const click2 = async () => {
    const result = await AsyncDemoModal2();
    alert(result);
  };

  const click3 = async () => {
    const result = await AsyncDemoModal3();
    alert(result);
  };
  const click4 = async () => {
    const result = await AsyncDemoModal4();
    alert(result);
  };

  return (
    <>
      <div>
        <p>对一个函数组件modal化</p>
        <p>1. 异步modal内容组件需要实现 AsyncModalifyFC 类型</p>
        <p>2. 异步modal内容组件需要调用 emitter.on(AsyncModalEvents.ok) 方法提交值</p>
      </div>
      {[click2, click3, click4].map((handler, index) => {
        return (
          <p key={`demo-${index}`}>
            <Button type="primary" onClick={handler}>
              第{index + 1}种
            </Button>
          </p>
        );
      })}
    </>
  );
}

export function AsyncCustomization() {
  const Custom: AsyncModalifyFC<{}, string> = ({ emitter }) => {
    // 通过emit submit的第二个参数传递值
    const submit = () => {
      // 可以先处理其他业务逻辑，比如表单校验等
      // ....

      // 然后提交值给调用者
      emitter?.emit(AsyncModalEvents.submit, 'it is ok');
    };
    return (
      <Space size={30}>
        <Button onClick={() => emitter?.emit(AsyncModalEvents.close)}>自定义按钮取消弹框</Button>
        <Button onClick={() => submit()} type="primary">
          自定义按钮确定提交
        </Button>
      </Space>
    );
  };

  const asyncCustom = asyncModalify(Custom, {
    // 关掉弹框底部的按钮
    footer: false,
    title: '自定义弹框',
    closable: true,
  });

  const click = async () => {
    const v = await asyncCustom();

    alert(v);
  };

  return <Button onClick={click}>自定义底部按钮</Button>;
}

export function AsyncConfirm() {
  const confirm = async () => {
    try {
      await asyncConfirm('是否确认本次操作？');
      alert('已确认');
    } catch (e) {
      // 若不需要处理取消行为，可以不加try, catch
      alert('已取消');
    }
  };
  return <Button onClick={confirm}>异步的二次确认框</Button>;
}

export default {
  title: 'Components/AsyncModalify',
  component: () => <>asyncModalify()</>,
} as Meta;
