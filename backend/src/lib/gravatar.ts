"use strict";
import config from "../../config";
import md5 from "md5";

const GravatarImageErrorDefaultValue = [
    'mp',
    '404',
    'https://secure.download.dm.origin.com/production/avatar/prod/1/599/208x208.JPEG'
]

function getGravatarUrl() {
    if (!config.gravatar && !config.gravatar.domain) return "https://www.gravatar.com";

    return config.gravatar.domain;
}

/**
 * get gravatar Avatar
 * by https://cn.gravatar.com/site/implement/images/
 * @param {String} email
 * @param errorImagerType
 * @returns {string|null}
 */
function getGravatarAvatar(email: string, errorImagerType = 2) {
    if (!email || email == '') return null;

    return `${getGravatarUrl()}/avatar/${md5(email)}?d=${GravatarImageErrorDefaultValue[errorImagerType]}`;
}

/**
 * gravatar Profile info
 * by https://cn.gravatar.com/site/implement/profiles/json/
 * @param email
 * @returns {jsonp}
 */
function getGravatarProfile(email: string) {
    if (!email) return null;

    return `${getGravatarUrl()}/${md5(email)}.json`;
}

export {
    getGravatarAvatar,
    getGravatarProfile
}
