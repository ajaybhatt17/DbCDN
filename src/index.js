import Dropbox from 'dropbox';

var Promise = require('bluebird');

import _ from 'underscore';

export const CONTENT_TYPE = {
    MEDIA: 'media',
    DOC: 'doc'
};

export default class DbCDN {

    constructor(accessToken) {
        this.dbx = new Dropbox({accessToken: accessToken});
    }

    async readFolder(path, mimeType, folderName = '') {
        let response = this.dbx.filesListFolder({
            path: path,
            include_media_info: true,
        });
        let e = await Promise.map(response.entries, e => {
            if (e['.tag'] === 'file') {
                return this._getFileMetaData(e, folderName);
            } else if (e['.tag'] === 'folder') {
                return this.readFolder(e.id, mimeType, e.name);
            }
        });
        if (!_.isEmpty(folderName)) {
            return Promise.resolve(_.flatten(e));
        } else {
            return Promise.resolve(this._cdnWrapper(_.flatten(e), mimeType));
        }
    }

    async readSharedFolder(sharedLink, mimeType, deepSearch = false, folderName = '') {
        let response = await this.dbx.filesListFolder({
            path: '',
            include_media_info: true,
            shared_link: {url: sharedLink}
        });
        let e = await Promise.map(response.entries, e => {
            if (e['.tag'] === 'file') {
                return this._getFileMetaData(e, folderName);
            } else if (e['.tag'] === 'folder') {
                return this.readFolder(e.id, mimeType, e.name);
            }
        });
        if (!_.isEmpty(folderName)) {
            return Promise.resolve(_.flatten(e));
        } else {
            return Promise.resolve(this._cdnWrapper(_.flatten(e), mimeType));
        }
    }

    async readMediaAlbumFolder(path) {
        let response = await this._readFileContent(path + '/shared_link.json');
        if (response !== null) {
            return response;
        } else {
            let e = await this._readMediaAlbumFolder({path: path});
            await this._writeDataToFile(path + '/shared_link.json', JSON.stringify(e));
            return Promise.resolve(e);
        }
    }

    readMediaAlbumFolderWithSharedLink(sharedLink) {
        return this._readMediaAlbumFolder({path: '', shared_link: {url: sharedLink}});
    }

    async _readMediaAlbumFolder(searchObj, folderName = '') {
        let response = await this.dbx.filesListFolder(searchObj);
        let entries = response.entries.filter(e => e['.tag'] === 'folder');
        let output = await Promise.map(entries, e => {
            return this._readDetailMediaAlbumFiles(e.id, e.name, true);
        });
        if (!_.isEmpty(folderName)) {
            return Promise.resolve(_.flatten(output));
        } else {
            return Promise.resolve(this._cdnWrapper(_.flatten(output), CONTENT_TYPE.MEDIA));
        }
    }

    async readDetailMediaAlbumFiles(path, folderName = '', oneFile = false) {
        let data = await this.dbx.filesListFolder({path: path, include_media_info: true});
        let file_path = data.entries[0].path_display.split('/')[1];
        let sharedContent = await this._readFileContent('/' + file_path + '/shared_link.json');
        if (sharedContent !== null) {
            console.log('sharedcontent', sharedContent);
            return sharedContent;
        } else {
            let d = await this._readDetailMediaAlbumFiles(path, folderName, oneFile);
            await this._writeDataToFile('/' + file_path + '/shared_link.json', JSON.stringify(d));
            return d;
        }
    }

    async _readDetailMediaAlbumFiles(path, folderName = '', oneFile = false) {
        let album_name;
        let response = await this.dbx.filesListFolder({path: path, include_media_info: true});
        if (response.entries.length > 0) {
            let c = response.entries[0].path_display.split("/");
            album_name = c[c.length - 2];
        }
        let entries = response.entries.filter(e => e['.tag'] === 'file');
        if (oneFile) {
            entries = [entries[0]];
        }
        let output = await Promise.map(entries, e => {
            return this._getFileMetaData(e, folderName, path);
        });
        if (!_.isEmpty(folderName)) {
            return Promise.resolve(_.flatten(output));
        } else {
            return Promise.resolve({
                album_id: path.replace('id:', ''),
                album_name: album_name,
                items: this._cdnWrapperEntries(_.flatten(output), CONTENT_TYPE.MEDIA)
            });
        }

    }

    async _getFileMetaData(file, folderName = '', folderId = '') {
        let response = await this.dbx.sharingListSharedLinks({
            path: file.id
        });
        let link = response.links.filter(e => e.id === file.id)[0];
        if (folderName) {
            file['folderName'] = folderName;
        }
        if (folderId) {
            file['folderId'] = folderId;
        }
        if (link) {
            file.url = link.url.replace("?dl=0", "?raw=1");
            return Promise.resolve(file);
        } else {
            return this._createFileSharedLink(file);
        }
    }

    _createFileSharedLink(file) {
        return new Promise((resolve, reject) => {
            this.dbx.sharingCreateSharedLinkWithSettings({
                path: file.id,
                settings: {
                    requested_visibility: {
                        ".tag": "public"
                    }
                }
            })
                .then(function (response) {
                    file.url = response.url;
                    return resolve(file);
                })
                .catch(function (error) {
                    console.log(error);
                    return reject(error);
                });
        });

    }


    _cdnWrapper(files, mimeType) {
        let res = files.map(e => {
            let d = {
                name: e.name,
                url: e.url,
                title: e.name.split(".")[0],
                album: e.folderName,
                album_id: e.folderId,
                slug: e.name.split(".")[0].toLowerCase().replace(new RegExp(" ", 'g'), "-")
            };
            if (e.media_info) {
                Object.assign(d, {
                    time_taken: e.media_info.metadata.time_taken,
                    location: e.media_info.metadata.location,
                    dimensions: e.media_info.metadata.dimensions
                });
            }
            return d;
        });
        if (mimeType === CONTENT_TYPE.MEDIA) {
            let c = _.groupBy(res, e => {
                return e['album'] + '|||' + e['album_id'];
            });
            return Object.keys(c).map(e => {
                return {
                    album_name: e.split('|||')[0],
                    album_id: e.split('|||')[1].replace("id:", ""),
                    entries: c[e]
                }
            });
        } else {
            return res;
        }
    }

    _cdnWrapperEntries(files, mimeType) {
        return files.map(e => {
            let d = {
                id: e.id.replace('id:', ''),
                name: e.name,
                url: e.url,
                title: e.name.split(".")[0],
                slug: e.name.split(".")[0].toLowerCase().replace(new RegExp(" ", 'g'), "-")
            };
            if (e.media_info) {
                Object.assign(d, {
                    time_taken: e.media_info.metadata.time_taken,
                    location: e.media_info.metadata.location,
                    dimensions: e.media_info.metadata.dimensions
                });
            }
            return d;
        })
    }

    _writeDataToFile(fileName, data) {
        return this.dbx.filesUpload({
            contents: data,
            path: fileName
        }).then(response => {
            return response;
        }).catch(error => {
            return error;
        })
    }

    _readFileContent(fileName) {
        return new Promise((resolve, reject) => {
            this.dbx.filesDownload({path: fileName})
                .then(response => {
                    return resolve(JSON.parse(response.fileBinary));
                })
                .catch(error => {
                    return resolve(null);
                });
        });
    }

}