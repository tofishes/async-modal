import React from 'react';
import { Button, Modal, ModalFuncProps } from 'antd';
import { Button as QrcButton } from '@qrc/button';

import Emitter from './event-emiter';

export type AsyncModalProps = {
  footer?: boolean;
  cancelBtn?: boolean;
} & Omit<ModalFuncProps, 'content'>;

export enum AsyncModalEvents {
  ok = 'ok',
  cancel = 'cancel',
  submit = 'submit',
  close = 'close',
}

interface Events<Value> {
  /**
   * 绑定确定按钮触发事件
   */
  on(name: AsyncModalEvents.ok, handler: () => Promise<Value> | Value): void;

  /**
   * 绑定取消按钮触发事件
   */
  on(name: AsyncModalEvents.cancel, handler: () => Promise<void> | void): void;

  /**
   * 主动提交确定
   */
  emit(name: AsyncModalEvents.submit, value?: Value): void;

  /**
   * 主动关闭弹框方法
   */
  emit(name: AsyncModalEvents.close): void;
}

/**
 * 考虑到组件既可以单独使用，也可以modal化
 * 以下handler注入都为可选
 */
type WithAsyncModalHandler<Value> = {
  emitter?: Events<Value>;
};

export type AsyncModalComponent<Value> = React.ReactNode & WithAsyncModalHandler<Value>;

export type AsyncModalifyFC<Props, Value> = React.FC<Props & WithAsyncModalHandler<Value>>;

/**
 * 注：处于试用阶段，逻辑可能有缺失或实现有问题
 *
 * 异步调用modal, 基本逻辑封装，基于此，还提供了
 * 1. asyncModalify对内容组件异步弹框化
 * 2. asyncConfirm 异步确认框
 */
export function asyncModal<Value>(
  component: AsyncModalComponent<Value>,
  props: AsyncModalProps,
): Promise<Value> {
  const {
    onOk,
    onCancel,
    className = '',
    title = '',
    centered = true,
    footer = true,
    closable = true,
    okText = '确定',
    cancelText = '取消',
    cancelBtn = true,
    ...others
  } = props;
  return new Promise((resolve, reject) => {
    let v: Value;
    const emitter = new Emitter();

    const ok = async (...args: any[]) => {
      [v] = await emitter.emit(AsyncModalEvents.ok);

      if (onOk) {
        v = await onOk(v, ...args);
      }

      return emitter.emit(AsyncModalEvents.submit, v);
    };

    const cancel = async (...args: any[]) => {
      await emitter.emit('cancel');

      if (onCancel) {
        await onCancel(...args);
      }

      emitter.emit(AsyncModalEvents.close);
    };

    const body = (
      <>
        <h4 className="async-modal-title">{title}</h4>
        <div className="async-modal-body">
          {React.Children.map<React.ReactNode, React.ReactNode>(component, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                emitter,
              });
            }

            return child;
          })}
        </div>

        {footer && (
          <div className="async-modal-footer">
            {cancelBtn && <Button onClick={cancel}>{cancelText}</Button>}
            <QrcButton onClick={ok} type="primary">
              {okText}
            </QrcButton>
          </div>
        )}
      </>
    );

    const modal = Modal.confirm({
      width: 800,
      closable,
      centered,
      className: `async-modal${className ? ` ${className}` : ''}`,
      icon: null,
      content: body,
      onCancel: cancel,
      onOk: ok,
      ...others,
    });

    emitter.on(AsyncModalEvents.submit, (value: Value) => {
      resolve(value);
      modal.destroy();
    });

    emitter.on(AsyncModalEvents.close, () => {
      reject();
      modal.destroy();
    });
  });
}

type AsyncModalPropsGetter<Props> = (props?: Props) => AsyncModalProps;
/**
 * 对一个函数组件modal化
 * 1. 异步modal内容组件需要实现 AsyncModalifyFC 类型
 * 2. 异步modal内容组件需要调用 emitter.on('ok') 方法提交值
 */
export const asyncModalify = <Props extends Object, Value>(
  Component: AsyncModalifyFC<Props, Value>,
  asyncModalProps: AsyncModalProps | AsyncModalPropsGetter<Props> = {},
) => {
  return (props?: Props) => {
    const modalProps =
      typeof asyncModalProps === 'function' ? asyncModalProps(props) : asyncModalProps;

    return asyncModal<Value>(<Component {...(props || ({} as Props))} />, modalProps);
  };
};

type AsyncConfirm = (
  content: AsyncModalComponent<boolean>,
  props?: { okText?: string; cancelText?: string; title?: string },
) => Promise<boolean>;

/**
 * 异步的二次确认框
 * @param content 确认框内容
 * @param props 确认框属性
 * @returns
 */
export const asyncConfirm: AsyncConfirm = (content, props = {}) => {
  const { okText = '确定', cancelText = '取消', title = '提示' } = props;

  return asyncModal(content, {
    title,
    okText,
    cancelText,
    width: 460,
    onOk() {
      return true;
    },
  });
};

/**
 * 异步的确认框
 * @param content 内容
 * @param props 弹框属性
 * @returns
 */
export const asyncAlert: AsyncConfirm = async (content, props = {}) => {
  const { okText = '确定', title = '提示' } = props;

  try {
    await asyncModal(content, {
      title,
      okText,
      width: 460,
      cancelBtn: false,
    });
  } catch (e) {
  } finally {
    return true;
  }
};

export default asyncModal;
