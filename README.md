# Password Generator Chrome Extension

一个 MV3 Chrome extension，点击扩展图标后会打开密码生成弹窗。

## 功能

- 打开 popup 时按上次保存的选项立即生成随机密码
- 支持字母、数字、安全符号、复杂符号四类字符
- 符号集使用配置文件友好的 `-_.~+=`
- 复杂符号集使用 `@%&?;|<>[]{}()*!`，默认不选中
- 根据浏览器显示语言自动切换中文或英文界面
- 自动排除容易看错的字符：`0`、`1`、`O`、`o`、`I`、`l`
- 支持 6 到 64 位长度，默认 16
- 按合并后的可用字符池等概率选择字符，并保证每个勾选类别至少出现一次
- 生成结果不会出现两个连续相同字符
- 修改选项或长度时自动重新生成密码
- 密码文本框可手动编辑
- 点击旋转箭头图标可按当前设置重新生成密码
- 点击复制图标复制当前文本框内容
- 使用 `chrome.storage.local` 保存用户选项
- 包含 Chrome extension 图标资源

## 本地安装

1. 打开 Chrome 的 `chrome://extensions/`
2. 开启右上角的 Developer mode
3. 点击 Load unpacked
4. 选择这个目录：`/Users/lialiu/work/public_projects/password_generator`
