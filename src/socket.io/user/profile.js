'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUser = void 0;
const user = __importStar(require("../../user"));
const privileges = __importStar(require("../../privileges"));
const plugins = __importStar(require("../../plugins"));
const sockets = __importStar(require(".."));
const api = __importStar(require("../../api"));
function SocketUser(SocketUser) {
    SocketUser.updateCover = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!socket.uid) {
                throw new Error('[[error:no-privileges]]');
            }
            yield user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
            yield user.checkMinReputation(socket.uid, data.uid, 'min:rep:cover-picture');
            return yield user.updateCoverPicture(data);
        });
    };
    SocketUser.uploadCroppedPicture = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!socket.uid || !(yield privileges.users.canEdit(socket.uid, data.uid))) {
                throw new Error('[[error:no-privileges]]');
            }
            yield user.checkMinReputation(socket.uid, data.uid, 'min:rep:profile-picture');
            data.callerUid = socket.uid;
            return yield user.uploadCroppedPicture(data);
        });
    };
    SocketUser.removeCover = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!socket.uid) {
                throw new Error('[[error:no-privileges]]');
            }
            yield user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
            const userData = yield user.getUserFields(data.uid, ['cover:url']);
            // 'keepAllUserImages' is ignored, since there is explicit user intent
            yield user.removeCoverPicture(data);
            plugins.hooks.fire('action:user.removeCoverPicture', {
                callerUid: socket.uid,
                uid: data.uid,
                user: userData,
            });
        });
    };
    SocketUser.toggleBlock = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isBlocked = yield user.blocks.is(data.blockeeUid, data.blockerUid);
            yield user.blocks.can(socket.uid, data.blockerUid, data.blockeeUid, isBlocked ? 'unblock' : 'block');
            yield user.blocks[isBlocked ? 'remove' : 'add'](data.blockeeUid, data.blockerUid);
            return !isBlocked;
        });
    };
    SocketUser.exportProfile = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield doExport(socket, data, 'profile');
        });
    };
    SocketUser.exportPosts = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield doExport(socket, data, 'posts');
        });
    };
    SocketUser.exportUploads = function (socket, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield doExport(socket, data, 'uploads');
        });
    };
    function doExport(socket, data, type) {
        return __awaiter(this, void 0, void 0, function* () {
            sockets.warnDeprecated(socket, 'POST /api/v3/users/:uid/exports/:type');
            if (!socket.uid) {
                throw new Error('[[error:invalid-uid]]');
            }
            if (!data || parseInt(data.uid, 10) <= 0) {
                throw new Error('[[error:invalid-data]]');
            }
            yield user.isAdminOrSelf(socket.uid, data.uid);
            api.users.generateExport(socket, Object.assign({ type }, data));
        });
    }
}
exports.SocketUser = SocketUser;
;
