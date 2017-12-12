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

    readFolder(path, mimeType, folderName = '') {
        return new Promise((resolve, reject) => {
            this.dbx.filesListFolder({
                path: path,
                include_media_info: true,
            })
                .then((response) => {
                    return Promise.map(response.entries, e => {
                        if (e['.tag'] === 'file') {
                            return this._getFileMetaData(e, folderName);
                        } else if (e['.tag'] === 'folder') {
                            return this.readFolder(e.id, mimeType, e.name);
                        }
                    }).then(e => {
                        if (!_.isEmpty(folderName)) {
                            return resolve(_.flatten(e));
                        } else {
                            return resolve(this._cdnWrapper(_.flatten(e), mimeType));
                        }
                    });
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    readSharedFolder(sharedLink, mimeType, deepSearch = false, folderName = '') {
        return new Promise((resolve, reject) => {
            this.dbx.filesListFolder({
                path: '',
                include_media_info: true,
                shared_link: {url: sharedLink}
            })
                .then((response) => {
                    return Promise.map(response.entries, e => {
                        if (e['.tag'] === 'file') {
                            return this._getFileMetaData(e, folderName);
                        } else if (e['.tag'] === 'folder') {
                            return this.readFolder(e.id, mimeType, e.name);
                        }
                    }).then(e => {
                        if (!_.isEmpty(folderName)) {
                            return resolve(_.flatten(e));
                        } else {
                            return resolve(this._cdnWrapper(_.flatten(e), mimeType));
                        }
                    });
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    readMediaAlbumFolder(path) {
        return this._readMediaAlbumFolder({path: path});
    }

    readMediaAlbumFolderWithSharedLink(sharedLink) {
        return this._readMediaAlbumFolder({path: '', shared_link: {url: sharedLink}});
    }

    _readMediaAlbumFolder(searchObj, folderName = '') {
        return new Promise((resolve, reject) => {
            this.dbx.filesListFolder(searchObj)
                .then((response) => {
                    let entries = response.entries.filter(e => e['.tag'] === 'folder');
                    return Promise.map(entries, e => {
                        return this.readDetailMediaAlbumFiles(e.id, e.name, true);
                    }).then(e => {
                        if (!_.isEmpty(folderName)) {
                            return resolve(_.flatten(e));
                        } else {
                            return resolve(this._cdnWrapper(_.flatten(e), CONTENT_TYPE.MEDIA));
                        }
                    });
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    readDetailMediaAlbumFiles(path, folderName = '', oneFile = false) {
        let album_name;
        return new Promise((resolve, reject) => {
            this.dbx.filesListFolder({
                path: path, include_media_info: true
            })
                .then((response) => {
                    if (response.entries.length > 0) {
                        let c = response.entries[0].path_display.split("/");
                        album_name = c[c.length - 2];
                    }
                    let entries = response.entries.filter(e => e['.tag'] === 'file');
                    if (oneFile) {
                        entries = [entries[0]];
                    }
                    return Promise.map(entries, e => {
                        return this._getFileMetaData(e, folderName, path);
                    }).then(e => {
                        if (!_.isEmpty(folderName)) {
                            return resolve(_.flatten(e));
                        } else {
                            return resolve({
                                album_id: path.replace('id:', ''),
                                album_name: album_name,
                                items: this._cdnWrapperEntries(_.flatten(e), CONTENT_TYPE.MEDIA)
                            });
                        }
                    });
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    _getFileMetaData(file, folderName = '', folderId = '') {
        return new Promise((resolve, reject) => {
            this.dbx.sharingListSharedLinks({
                path: file.id
            })
                .then((response) => {
                    let link = response.links.filter(e => e.id === file.id)[0];
                    if (folderName) {
                        file['folderName'] = folderName;
                    }
                    if (folderId) {
                        file['folderId'] = folderId;
                    }
                    if (link) {
                        file.url = link.url.replace("?dl=0", "?raw=1");
                        return resolve(file);
                    } else {
                        return this._createFileSharedLink(file);
                    }
                })
                .catch(function (error) {
                    console.log(error);
                    return reject(error);
                });
        });

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

}