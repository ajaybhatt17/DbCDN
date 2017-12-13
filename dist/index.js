'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CONTENT_TYPE = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _dropbox = require('dropbox');

var _dropbox2 = _interopRequireDefault(_dropbox);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');

var CONTENT_TYPE = exports.CONTENT_TYPE = {
    MEDIA: 'media',
    DOC: 'doc'
};

var DbCDN = function () {
    function DbCDN(accessToken) {
        (0, _classCallCheck3.default)(this, DbCDN);

        this.dbx = new _dropbox2.default({ accessToken: accessToken });
    }

    (0, _createClass3.default)(DbCDN, [{
        key: 'readFolder',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(path, mimeType) {
                var _this = this;

                var folderName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
                var response, e;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                response = this.dbx.filesListFolder({
                                    path: path,
                                    include_media_info: true
                                });
                                _context.next = 3;
                                return Promise.map(response.entries, function (e) {
                                    if (e['.tag'] === 'file') {
                                        return _this._getFileMetaData(e, folderName);
                                    } else if (e['.tag'] === 'folder') {
                                        return _this.readFolder(e.id, mimeType, e.name);
                                    }
                                });

                            case 3:
                                e = _context.sent;

                                if (_underscore2.default.isEmpty(folderName)) {
                                    _context.next = 8;
                                    break;
                                }

                                return _context.abrupt('return', Promise.resolve(_underscore2.default.flatten(e)));

                            case 8:
                                return _context.abrupt('return', Promise.resolve(this._cdnWrapper(_underscore2.default.flatten(e), mimeType)));

                            case 9:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function readFolder(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return readFolder;
        }()
    }, {
        key: 'readSharedFolder',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(sharedLink, mimeType) {
                var _this2 = this;

                var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var folderName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
                var response, e;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.dbx.filesListFolder({
                                    path: '',
                                    include_media_info: true,
                                    shared_link: { url: sharedLink }
                                });

                            case 2:
                                response = _context2.sent;
                                _context2.next = 5;
                                return Promise.map(response.entries, function (e) {
                                    if (e['.tag'] === 'file') {
                                        return _this2._getFileMetaData(e, folderName);
                                    } else if (e['.tag'] === 'folder') {
                                        return _this2.readFolder(e.id, mimeType, e.name);
                                    }
                                });

                            case 5:
                                e = _context2.sent;

                                if (_underscore2.default.isEmpty(folderName)) {
                                    _context2.next = 10;
                                    break;
                                }

                                return _context2.abrupt('return', Promise.resolve(_underscore2.default.flatten(e)));

                            case 10:
                                return _context2.abrupt('return', Promise.resolve(this._cdnWrapper(_underscore2.default.flatten(e), mimeType)));

                            case 11:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function readSharedFolder(_x4, _x5) {
                return _ref2.apply(this, arguments);
            }

            return readSharedFolder;
        }()
    }, {
        key: 'readMediaAlbumFolder',
        value: function () {
            var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(path) {
                var response, e;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return this._readFileContent(path + '/shared_link.json');

                            case 2:
                                response = _context3.sent;

                                console.log('read file');

                                if (!(response !== null)) {
                                    _context3.next = 9;
                                    break;
                                }

                                console.log('responding file');
                                return _context3.abrupt('return', Promise.resolve(response));

                            case 9:
                                console.log('read api');
                                _context3.next = 12;
                                return this._readMediaAlbumFolder({ path: path });

                            case 12:
                                e = _context3.sent;
                                _context3.next = 15;
                                return this._writeDataToFile(path + '/shared_link.json', JSON.stringify(e));

                            case 15:
                                return _context3.abrupt('return', Promise.resolve(e));

                            case 16:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function readMediaAlbumFolder(_x8) {
                return _ref3.apply(this, arguments);
            }

            return readMediaAlbumFolder;
        }()
    }, {
        key: 'readMediaAlbumFolderWithSharedLink',
        value: function readMediaAlbumFolderWithSharedLink(sharedLink) {
            return this._readMediaAlbumFolder({ path: '', shared_link: { url: sharedLink } });
        }
    }, {
        key: '_readMediaAlbumFolder',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(searchObj) {
                var _this3 = this;

                var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                var response, entries, output;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return this.dbx.filesListFolder(searchObj);

                            case 2:
                                response = _context4.sent;
                                entries = response.entries.filter(function (e) {
                                    return e['.tag'] === 'folder';
                                });
                                _context4.next = 6;
                                return Promise.map(entries, function (e) {
                                    return _this3._readDetailMediaAlbumFiles(e.id, e.name, true);
                                });

                            case 6:
                                output = _context4.sent;

                                if (_underscore2.default.isEmpty(folderName)) {
                                    _context4.next = 11;
                                    break;
                                }

                                return _context4.abrupt('return', Promise.resolve(_underscore2.default.flatten(output)));

                            case 11:
                                return _context4.abrupt('return', Promise.resolve(this._cdnWrapper(_underscore2.default.flatten(output), CONTENT_TYPE.MEDIA)));

                            case 12:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function _readMediaAlbumFolder(_x9) {
                return _ref4.apply(this, arguments);
            }

            return _readMediaAlbumFolder;
        }()
    }, {
        key: 'readDetailMediaAlbumFiles',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(path) {
                var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                var oneFile = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var data, file_path, sharedContent, d;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                _context5.next = 2;
                                return this.dbx.filesListFolder({ path: path, include_media_info: true });

                            case 2:
                                data = _context5.sent;
                                file_path = data.entries[0].path_display.split('/')[1];
                                _context5.next = 6;
                                return this._readFileContent('/' + file_path + '/shared_link.json');

                            case 6:
                                sharedContent = _context5.sent;

                                if (!(sharedContent !== null)) {
                                    _context5.next = 11;
                                    break;
                                }

                                return _context5.abrupt('return', sharedContent);

                            case 11:
                                _context5.next = 13;
                                return this._readDetailMediaAlbumFiles(path, folderName, oneFile);

                            case 13:
                                d = _context5.sent;
                                _context5.next = 16;
                                return this._writeDataToFile('/' + file_path + '/shared_link.json', JSON.stringify(d));

                            case 16:
                                return _context5.abrupt('return', d);

                            case 17:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function readDetailMediaAlbumFiles(_x11) {
                return _ref5.apply(this, arguments);
            }

            return readDetailMediaAlbumFiles;
        }()
    }, {
        key: '_readDetailMediaAlbumFiles',
        value: function () {
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(path) {
                var _this4 = this;

                var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                var oneFile = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var album_name, response, c, entries, output;
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                album_name = void 0;
                                _context6.next = 3;
                                return this.dbx.filesListFolder({ path: path, include_media_info: true });

                            case 3:
                                response = _context6.sent;

                                if (response.entries.length > 0) {
                                    c = response.entries[0].path_display.split("/");

                                    album_name = c[c.length - 2];
                                }
                                entries = response.entries.filter(function (e) {
                                    return e['.tag'] === 'file' && e.media_info;
                                });

                                if (oneFile) {
                                    entries = [entries[0]];
                                }
                                _context6.next = 9;
                                return Promise.map(entries, function (e) {
                                    return _this4._getFileMetaData(e, folderName, path);
                                });

                            case 9:
                                output = _context6.sent;

                                if (_underscore2.default.isEmpty(folderName)) {
                                    _context6.next = 14;
                                    break;
                                }

                                return _context6.abrupt('return', Promise.resolve(_underscore2.default.flatten(output)));

                            case 14:
                                return _context6.abrupt('return', Promise.resolve({
                                    album_id: path.replace('id:', ''),
                                    album_name: album_name,
                                    items: this._cdnWrapperEntries(_underscore2.default.flatten(output), CONTENT_TYPE.MEDIA)
                                }));

                            case 15:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function _readDetailMediaAlbumFiles(_x14) {
                return _ref6.apply(this, arguments);
            }

            return _readDetailMediaAlbumFiles;
        }()
    }, {
        key: '_getFileMetaData',
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(file) {
                var folderName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                var folderId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
                var response, link;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                _context7.next = 2;
                                return this.dbx.sharingListSharedLinks({
                                    path: file.id
                                });

                            case 2:
                                response = _context7.sent;
                                link = response.links.filter(function (e) {
                                    return e.id === file.id;
                                })[0];

                                if (folderName) {
                                    file['folderName'] = folderName;
                                }
                                if (folderId) {
                                    file['folderId'] = folderId;
                                }

                                if (!link) {
                                    _context7.next = 11;
                                    break;
                                }

                                file.url = link.url.replace("?dl=0", "?raw=1");
                                return _context7.abrupt('return', Promise.resolve(file));

                            case 11:
                                return _context7.abrupt('return', this._createFileSharedLink(file));

                            case 12:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function _getFileMetaData(_x17) {
                return _ref7.apply(this, arguments);
            }

            return _getFileMetaData;
        }()
    }, {
        key: '_createFileSharedLink',
        value: function _createFileSharedLink(file) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                _this5.dbx.sharingCreateSharedLinkWithSettings({
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
    }, {
        key: '_writeDataToFile',
        value: function _writeDataToFile(fileName, data) {
            return this.dbx.filesUpload({
                contents: data,
                path: fileName
            }).then(function (response) {
                return response;
            }).catch(function (error) {
                return error;
            });
        }
    }, {
        key: '_readFileContent',
        value: function _readFileContent(fileName) {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                _this6.dbx.filesDownload({ path: fileName }).then(function (response) {
                    return resolve(JSON.parse(response.fileBinary));
                }).catch(function (error) {
                    return resolve(null);
                });
            });
        }
    }]);
    return DbCDN;
}();

exports.default = DbCDN;