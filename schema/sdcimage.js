/**
 * Copyright 2012 Joyent, Inc.  All rights reserved.
 *
 * An image in SDC IMGAPI.
 */

var util = require('util'),
    format = util.format;
var ldap = require('ldapjs');

var Validator = require('../lib/schema/validator');

var UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;



//---- API

function SDCImage() {
    Validator.call(this, {
        name: 'sdcimage',
        required: {
            uuid: 1,
            name: 1,
            disabled: 1,
            type: 1,
            os: 1,
            type: 1,
            activated: 1
        },
        optional: {
            published_at: 1,
            files: 1,
            description: 1,
            requirements: 1,
            datacenter: 0,  /* one or more */
            tag: 0,  /* one or more */
            urn: 1  /* DEPRECATED */
        }
    });
}
util.inherits(SDCImage, Validator);


SDCImage.prototype.validate = function validate(entry, callback) {
    // Leaving validation to IMGAPI.
    return callback();
};



///--- Exports

module.exports = {
    createInstance: function createInstance() {
        return new SDCImage();
    }
};
