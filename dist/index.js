'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CONTENT_TYPE = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dropbox = require('dropbox');

var _dropbox2 = _interopRequireDefault(_dropbox);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');
var CONTENT_TYPE = exports.CONTENT_TYPE = {
    MEDIA: 'media',
    DOC: 'doc'
};

var DbCDN = function () {
    function DbCDN(accessToken) {
        _classCallCheck(this, DbCDN);

        this.dbx = new _dropbox2.default({ accessToken: accessToken });
    }

    _createClass(DbCDN, [{
        key: 'readFolder',
        value: function readFolder(path, mimeType) {
            var _this = this;

            var folderName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            return new Promise(function (resolve, reject) {
                _this.dbx.filesListFolder({
                    path: path,
                    include_media_info: true
                }).then(function (response) {
                    return Promise.map(response.entries, function (e) {
                        if (e['.tag'] === 'file') {
                            return _this._getFileMetaData(e, folderName);
                        } else if (e['.tag'] === 'folder') {
                            return _this.readFolder(e.id, mimeType, e.name);
                        }
                    }).then(function (e) {
                        if (!_underscore2.default.isEmpty(folderName)) {
                            return resolve(_underscore2.default.flatten(e));
                        } else {
                            return resolve(_this._cdnWrapper(_underscore2.default.flatten(e), mimeType));
                        }
                    });
                }).catch(function (error) {
                    return reject(error);
                });
            });
        }
    }, {
        key: 'readSharedFolder',
        value: function readSharedFolder(sharedLink, mimeType) {
            var _this2 = this;

            var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
            var folderName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

            return new Promise(function (resolve, reject) {
                _this2.dbx.filesListFolder({
                    path: '',
                    include_media_info: true,
                    shared_link: { url: sharedLink }
                }).then(function (response) {
                    return Promise.map(response.entries, function (e) {
                        if (e['.tag'] === 'file') {
                            return _this2._getFileMetaData(e, folderName);
                        } else if (e['.tag'] === 'folder') {
                            return _this2.readFolder(e.id, mimeType, e.name);
                        }
                    }).then(function (e) {
                        if (!_underscore2.default.isEmpty(folderName)) {
                            return resolve(_underscore2.default.flatten(e));
                        } else {
                            return resolve(_this2._cdnWrapper(_underscore2.default.flatten(e), mimeType));
                        }
                    });
                }).catch(function (error) {
                    return reject(error);
                });
            });
        }
    }, {
        key: 'readMediaAlbumFolder',
        value: function readMediaAlbumFolder(path) {
            return this._readMediaAlbumFolder({ path: path });
        }
    }, {
        key: 'readMediaAlbumFolderWithSharedLink',
        value: function readMediaAlbumFolderWithSharedLink(sharedLink) {
            return this._readMediaAlbumFolder({ path: '', shared_link: { url: sharedLink } });
        }
    }, {
        key: '_readMediaAlbumFolder',
        value: function _readMediaAlbumFolder(searchObj) {
            var _this3 = this;

            var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

            return new Promise(function (resolve, reject) {
                _this3.dbx.filesListFolder(searchObj).then(function (response) {
                    var entries = response.entries.filter(function (e) {
                        return e['.tag'] === 'folder';
                    });
                    return Promise.map(entries, function (e) {
                        return _this3.readDetailMediaAlbumFiles(e.id, e.name, true);
                    }).then(function (e) {
                        if (!_underscore2.default.isEmpty(folderName)) {
                            return resolve(_underscore2.default.flatten(e));
                        } else {
                            return resolve(_this3._cdnWrapper(_underscore2.default.flatten(e), CONTENT_TYPE.MEDIA));
                        }
                    });
                }).catch(function (error) {
                    return reject(error);
                });
            });
        }
    }, {
        key: 'readDetailMediaAlbumFiles',
        value: function readDetailMediaAlbumFiles(path) {
            var _this4 = this;

            var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var oneFile = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var album_name = void 0;
            return new Promise(function (resolve, reject) {
                _this4.dbx.filesListFolder({
                    path: path, include_media_info: true
                }).then(function (response) {
                    if (response.entries.length > 0) {
                        var c = response.entries[0].path_display.split("/");
                        album_name = c[c.length - 2];
                    }
                    var entries = response.entries.filter(function (e) {
                        return e['.tag'] === 'file';
                    });
                    if (oneFile) {
                        entries = [entries[0]];
                    }
                    return Promise.map(entries, function (e) {
                        return _this4._getFileMetaData(e, folderName, path);
                    }).then(function (e) {
                        if (!_underscore2.default.isEmpty(folderName)) {
                            return resolve(_underscore2.default.flatten(e));
                        } else {
                            return resolve({
                                album_id: path.replace('id:', ''),
                                album_name: album_name,
                                items: _this4._cdnWrapperEntries(_underscore2.default.flatten(e), CONTENT_TYPE.MEDIA)
                            });
                        }
                    });
                }).catch(function (error) {
                    return reject(error);
                });
            });
        }
    }, {
        key: '_getFileMetaData',
        value: function _getFileMetaData(file) {
            var _this5 = this;

            var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var folderId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            return new Promise(function (resolve, reject) {
                _this5.dbx.sharingListSharedLinks({
                    path: file.id
                }).then(function (response) {
                    var link = response.links.filter(function (e) {
                        return e.id === file.id;
                    })[0];
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
                        return _this5._createFileSharedLink(file);
                    }
                }).catch(function (error) {
                    console.log(error);
                    return reject(error);
                });
            });
        }
    }, {
        key: '_createFileSharedLink',
        value: function _createFileSharedLink(file) {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                _this6.dbx.sharingCreateSharedLinkWithSettings({
                    path: file.id,
                    settings: {
                        requested_visibility: {
                            ".tag": "public"
                        }
                    }
                }).then(function (response) {
                    file.url = response.url;
                    return resolve(file);
                }).catch(function (error) {
                    console.log(error);
                    return reject(error);
                });
            });
        }
    }, {
        key: '_cdnWrapper',
        value: function _cdnWrapper(files, mimeType) {
            var res = files.map(function (e) {
                var d = {
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
                var c = _underscore2.default.groupBy(res, function (e) {
                    return e['album'] + '|||' + e['album_id'];
                });
                return Object.keys(c).map(function (e) {
                    return {
                        album_name: e.split('|||')[0],
                        album_id: e.split('|||')[1].replace("id:", ""),
                        entries: c[e]
                    };
                });
            } else {
                return res;
            }
        }
    }, {
        key: '_cdnWrapperEntries',
        value: function _cdnWrapperEntries(files, mimeType) {
            return files.map(function (e) {
                var d = {
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
            });
        }
    }]);

    return DbCDN;
}();

exports.default = DbCDN;