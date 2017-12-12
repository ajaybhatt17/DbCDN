import {default as DbCDN, CONTENT_TYPE} from '../src/index';
import {DB_TOKEN, TEST_FOLDER_ID, TEST_SHARED_FOLDER_LINK, TEST_SHARED_FOLDER_NAME} from "../constant";

describe('Drop CDN', function () {

    describe('read photo album', function () {
        it('expect two files', function (done) {
            this.timeout(5000000);
            let dbcdn = new DbCDN(DB_TOKEN);
            dbcdn.readFolder(TEST_SHARED_FOLDER_NAME).then(function (d) {
                console.log(d);
                done();
            });
        });
    });


    describe('read shared folder', function () {
        it('expect two files', function (done) {
            this.timeout(5000000);
            let dbcdn = new DbCDN(DB_TOKEN);
            dbcdn.readSharedFolder(TEST_SHARED_FOLDER_LINK,
                CONTENT_TYPE.MEDIA).then(function (d) {
                console.log(d);
                done();
            }).catch(e => {
                console.log(e);
                done();
            });
        });
    });

    describe('read shared album folder', function () {
            it('expect two files', function (done) {
                this.timeout(5000000);
                let dbcdn = new DbCDN(DB_TOKEN);
                dbcdn.readMediaAlbumFolderWithSharedLink(TEST_SHARED_FOLDER_LINK).then(function (d) {
                    console.log(d);
                    done();
                }).catch(e => {
                    console.log(e);
                    done();
                });
            });
        });

    describe('read shared album files', function () {
        it('expect two files', function (done) {
            this.timeout(5000000);
            let dbcdn = new DbCDN(DB_TOKEN);
            dbcdn.readDetailMediaAlbumFiles(TEST_FOLDER_ID).then(function (d) {
                console.log(d);
                done();
            }).catch(e => {
                console.log(e);
                done();
            });
        });
    });

});
