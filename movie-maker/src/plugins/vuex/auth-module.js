import electron, {remote} from "electron";
import http from "http";
import Youtube from "youtube-api";
import express from "express";

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
        oauth: (state, getters) =>
            Youtube.authenticate({
                type: "oauth",
                client_id: state.ytId,
                client_secret: state.ytSecret,
                redirect_url: getters.redirectUrl,
            }),
        authUrl: (state, getters) =>
            getters.oauth.generateAuthUrl({
                access_type: "offline",
                scope: [
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube.readonly"
                ],
            }),
    },
    actions: {
        cacheAuth({state}) {
            localStorage.auth = JSON.stringify(state);
            console.log("Auth cached!");
        },
        setTokens({commit, getters, dispatch}, tokens) {
            commit('tokens', tokens);
            getters.oauth.setCredentials(tokens);
            dispatch('processAuth');
            console.log("set credentials");
        },
        async initializeAuth({state, getters, dispatch}) {
            if (!getters.isLoggedIn) return;
            getters.oauth.setCredentials(state.tokens);
            dispatch('processAuth');
        },
        async processAuth({commit}) {
            let result = await Youtube.channels.list({part: 'snippet', mine: true});
            let userInfo = result.data.items?.[0]?.snippet;
            commit("userInfo", userInfo);
            console.log(Youtube);
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
                        getters.oauth.getToken(req.query.code, (err, tokens) => {
                            remote.getCurrentWindow().focus();
                            resolve(tokens);
                        });
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