import electron, {remote, ipcRenderer} from "electron";
import http from "http";
import {google} from 'googleapis'
import Utils from "@/js/Utils";
import fs from 'fs';

const service = google.youtube('v3')

const express = window.require('express');

export default {
    state: {
        ytId: '',
        ytSecret: '',
        server: null,
        tokens: {
            access_token: null,
            refresh_token: null,
            scope: null,
            token_type: null,
            expiry_date: null,
        },
        userInfo: null,
        port: 38901,
        ...(JSON.parse(localStorage.getItem('auth') ?? '{}')),
    },
    mutations: {
        ytId: (state, value) => state.ytId = value,
        ytSecret: (state, value) => state.ytSecret = value,
        server: (state, server) => state.server = server,
        tokens: (state, tokens) => state.tokens = tokens,
        userInfo: (state, userInfo) => state.userInfo = userInfo,
    },
    getters: {
        isValidKeySet: () => (ytId, ytSecret) =>
            ytId !== "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" &&
            ytSecret !== "bbbbbbbbbbbbbbbbbbbbbbbbbb" &&
            ytId.length === 72 &&
            ytSecret.length === 24 &&
            ytId.endsWith('.apps.googleusercontent.com'),
        isKeySet: (state, getters) => getters.isValidKeySet(state.ytId, state.ytSecret),
        isLoggedIn: state =>
            state.tokens.access_token !== null &&
            state.tokens.refresh_token !== null,
        redirectUrl: state => 'http://localhost:' + state.port,
        oauth: (state, getters) => {
            let client = new google.auth.OAuth2(
                state.ytId,
                state.ytSecret,
                getters.redirectUrl,
            );
            console.log("stuff", client._clientId, client._clientSecret);
            client.on('tokens', (tokens) => {
                console.log("auto setting access token to", tokens.access_token);
                state.tokens.access_token = tokens.access_token;
            });
            return client;
        },
        authUrl: (state, getters) =>
            getters.oauth.generateAuthUrl({
                access_type: 'offline',
                scope: [
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube.readonly"
                ],
            })
    },
    actions: {
        async cancelUpload() {
            await ipcRenderer.invoke('cancelUpload');
        },
        async uploadVideo({dispatch, commit, state, getters, rootState}, filePath) {
            dispatch('resetYouTubeStatus');
            commit('ytUpload', true);

            let uploadId = Math.round(Math.random() * 10000000);

            ipcRenderer.on('progress' + uploadId, (e, uploaded, total) => {
                commit("ytProgress", {
                    uploaded,
                    total,
                    percent: uploaded / total,
                })
            });
            try {
                let result = await ipcRenderer.invoke('upload', {
                    title: 'test movie',
                    description: 'hello world',
                    privacy: 'Unlisted',
                    mime: 'video/mp4',
                    filePath,
                    ytId: state.ytId,
                    ytSecret: state.ytSecret,
                    tokens: state.tokens,
                    uploadId: uploadId,
                });
                console.log('invoke result', result);
                commit('ytDone', true);
            } catch (e) {
                commit('ytUpload', false);
                commit('statusError', e.message);
            }
        },

        async initializeAuth({state, getters, dispatch}) {
            if (!getters.isLoggedIn) return;
            dispatch('setTokens', state.tokens);
        },
        setTokens({commit, getters, dispatch}, tokens) {
            commit('tokens', tokens);
            console.log("SETTING CREDENTIALS", tokens);
            getters.oauth.setCredentials(tokens);
            dispatch('processAuth');
        },
        async processAuth({commit, getters}) {
            let result = await service.channels.list({auth: getters.oauth, part: 'snippet', mine: true});
            let userInfo = result.data.items?.[0]?.snippet;
            commit("userInfo", userInfo);
            console.log(service);
        },
        cacheAuth({state}) {
            localStorage.auth = JSON.stringify(state);
            console.log("Auth cached!");
        },
        resetYtLogin({state, commit}) {
            if (state.server !== null) {
                state.server.close();
                commit('server', null);
            }
        },
        async ytLogout({commit, dispatch}) {
            localStorage.removeItem('auth');
            commit('tokens', {
                access_token: null,
                refresh_token: null,
                scope: null,
                token_type: null,
                expiry_date: null,
            });
            commit('userInfo', null);
            await dispatch('cacheAuth');
        },
        ytLogin: async ({dispatch}) => {
            let tokens = await dispatch('firstLogin');
            console.log("Auth result from 'firstLogin'", tokens);
            await dispatch('setTokens', tokens);
            await dispatch('cacheAuth');
        },
        firstLogin: async ({getters, state, commit, dispatch}) => {
            return new Promise(async resolve => {
                if (!getters.isKeySet) {
                    console.warn("Can't log in, keys are not set");
                    return;
                }
                let {shell} = electron;
                console.log(getters.oauth, getters.authUrl);
                await shell.openExternal(getters.authUrl);

                if (state.server !== null)
                    state.server.close();

                const app = express();
                const server = http.createServer(app);

                app.get('/', async (req, res) => {
                    if (req.query.hasOwnProperty('code')) {
                        server.close()
                        commit('server', null);
                        console.log("Stopped listening on *:" + state.port);
                        let {tokens} = await getters.oauth.getToken(req.query.code);
                        remote.getCurrentWindow().focus();
                        resolve(tokens);
                    }
                    res.send(`
                        <html lang="en">
                            <head><title>Logged in to YouTube :)</title></head>
                            <body>
                                <h1>You can close this window</h1>
                                <script>
                                    window.close();
                                </script>
                            </body>
                        </html>
                    `);
                });

                commit('server', server);
                server.listen(state.port, () => {
                    console.log('listening on *:' + state.port);
                });
            })
        },
    },
}