### AsyncModal

基于React Antd组件库的Modal组件，封装为异步调用逻辑。

#### 异步Modal的优势

* 可在async function随处调用，保持同步逻辑。尤其在事件回调中有流程化执行逻辑时，保持执行顺序。

* 省去在jsx中声明modal组件及visible state管理，代码简化，可维护性增强。

* Modal内容和Modal框分离，一个内容组件既可以在Page中使用，也可以在Modal中直接复用。只需要用asyncModalify包裹内容组件即可。

* 每次Modal展示都会重新渲染内容组件，适合无需保持已填内容的场景。

* 提供类似window.alert window.confirm原生api的调用体验。

#### 使用示例

可参见 async-modal.stories.tsx 中的示例代码。