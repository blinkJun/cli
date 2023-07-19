# `tinyimg`

压缩当前文件夹下的图片

## 使用说明

`tinyimg <inputPath> <outputPath> [--deep]`：根据输入目录`inputPath`压缩图片到`outputPath`输出目录

-   `inputPath`：输入文件夹或者指定图片，不传则表示当前目录下的所有图片。
-   `outputPath`：输出文件夹，不传则表示覆盖当前文件夹下的图片。
-   `--deep`选项：默认只压缩当前文件夹下的图片，传入此选项时递归压缩所有子目录的图片。
