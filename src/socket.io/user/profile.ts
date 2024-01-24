import * as user from '../../user';
import * as privileges from '../../privileges';
import * as plugins from '../../plugins';
import * as sockets from '..';
import * as api from '../../api';


export interface SocketUserData {
    callerUid: string;
    uid: string;
}

export interface SocketUserUpdateCoverData extends SocketUserData {
    cover: string;
}

export interface SocketUserUploadCroppedPictureData extends SocketUserData {
    picture: string;
}

export interface SocketUserToggleBlockData {
    blockerUid: number;
    blockeeUid: number;
}

export interface Socket {
    uid: string;
}

export interface SocketUserFunctions {
    updateCover(socket: SocketUserData, data: SocketUserUpdateCoverData): Promise<any>;
    uploadCroppedPicture(socket: SocketUserData, data: SocketUserData): Promise<any>;
    removeCover(socket: SocketUserData, data: SocketUserData): Promise<any>;
    toggleBlock(socket: SocketUserData, data: SocketUserToggleBlockData): Promise<any>;
    exportProfile(socket: SocketUserData, data: SocketUserData): Promise<any>;
    exportPosts(socket: SocketUserData, data: SocketUserData): Promise<any>;
    exportUploads(socket: SocketUserData, data: SocketUserData): Promise<any>;
}

export function SocketUser(SocketUser:SocketUserFunctions) {
    SocketUser.updateCover = async function (socket: SocketUserData, data: SocketUserData) {
        if (!socket.uid) {
            throw new Error('[[error:no-privileges]]');
        }
        await user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
        await user.checkMinReputation(socket.uid, data.uid, 'min:rep:cover-picture');
        return await user.updateCoverPicture(data);
    };

    SocketUser.uploadCroppedPicture = async function (socket: SocketUserData, data: SocketUserData) {
        if (!socket.uid || !(await privileges.users.canEdit(socket.uid, data.uid))) {
            throw new Error('[[error:no-privileges]]');
        }

        await user.checkMinReputation(socket.uid, data.uid, 'min:rep:profile-picture');
        data.callerUid = socket.uid;
        return await user.uploadCroppedPicture(data);
    };

    SocketUser.removeCover = async function (socket: SocketUserData, data: SocketUserData) {
        if (!socket.uid) {
            throw new Error('[[error:no-privileges]]');
        }
        await user.isAdminOrGlobalModOrSelf(socket.uid, data.uid);
        const userData = await user.getUserFields(data.uid, ['cover:url']);
        // 'keepAllUserImages' is ignored, since there is explicit user intent
        await user.removeCoverPicture(data);
        plugins.hooks.fire('action:user.removeCoverPicture', {
            callerUid: socket.uid,
            uid: data.uid,
            user: userData,
        });
    };

    SocketUser.toggleBlock = async function (socket: SocketUserData, data: SocketUserToggleBlockData) {
        const isBlocked = await user.blocks.is(data.blockeeUid, data.blockerUid);
        await user.blocks.can(socket.uid, data.blockerUid, data.blockeeUid, isBlocked ? 'unblock' : 'block');
        await user.blocks[isBlocked ? 'remove' : 'add'](data.blockeeUid, data.blockerUid);
        return !isBlocked;
    };

    SocketUser.exportProfile = async function (socket: SocketUserData, data: SocketUserData) {
        await doExport(socket, data, 'profile');
    };

    SocketUser.exportPosts = async function (socket: SocketUserData, data: SocketUserData) {
        await doExport(socket, data, 'posts');
    };

    SocketUser.exportUploads = async function (socket: SocketUserData, data: SocketUserData) {
        await doExport(socket, data, 'uploads');
    };

    async function doExport(socket, data: SocketUserData, type: string) {
        sockets.warnDeprecated(socket, 'POST /api/v3/users/:uid/exports/:type');

        if (!socket.uid) {
            throw new Error('[[error:invalid-uid]]');
        }

        if (!data || parseInt(data.uid, 10) <= 0) {
            throw new Error('[[error:invalid-data]]');
        }

        await user.isAdminOrSelf(socket.uid, data.uid);

        api.users.generateExport(socket, { type, ...data });
    }
}
