
## Db-CDN

Client to use dropbox space to serve as cdn data

## Idea

Dropbox provide two type permission type - full dropbox and app folder based permission.

For this use app folder permission type while creating dropbox app at `https://www.dropbox.com/developers`

First call will index shared link for each file and 
save in shared_link.json for each folder.

Next consecutive calls will read shared_link file for file links

If you add new file/s in any folder then delete remove shared_link.json file


## Addition Info

Full dropbox - full dropbox access

App Folder - will give only particular folder access.

Your app folder will be in `/home/Apps/APP-FOLDER`
 
## Example/Demo

https://theelement-5b4d4.firebaseapp.com/ (https://github.com/ajaybhatt17/gallery-blog/)

## For testing

``cp constant.js.example constant.js``

change db token in constant.js

`npm test`

## License

[BSD](./LICENSE)

