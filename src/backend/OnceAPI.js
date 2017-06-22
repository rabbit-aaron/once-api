import express from "express"
import bodyParser from "body-parser";

const getUri = (view, method, prefix) => {
    return `${prefix}${slugify(view.name)}/${slugify(method)}`;
};

const LETTER_REGEX = /([A-Z])/g;

const slugify = (str) => {
    let count = 0;
    return str.replace(LETTER_REGEX, letter => {
        if (count++ === 0) {
            return letter.toLowerCase();
        } else {
            return `-${letter.toLowerCase()}`;
        }
    });
};

const getViewClassMethods = viewClass => {
    return Object.getOwnPropertyNames(viewClass.prototype).filter(name => {
        if (typeof viewClass.prototype[name] === "function" && name !== "constructor") {
            return true;
        }
        return false;
    });
};

export default class OnceAPI {
    constructor(views, prefix = "", mappingsURI = "__mappings__") {
        prefix += "/";
        let app = express();
        app.use(bodyParser.json());
        let uriRegistered = {};
        let mappings = {};
        views.forEach(view => {
            mappings[view.name] = {};
            getViewClassMethods(view).forEach(method => {
                let uri = getUri(view, method, prefix);
                if (uriRegistered[uri]) {
                    throw `URI conflict detected for ${view.name}.${method} and ${uriRegistered[uri]}: ${uri}`;
                }
                uriRegistered[uri] = `${view.name}.${method}`;
                mappings[view.name][method] = uri;
                app.post(uri, (req, res, next) => {
                    let v = new view(req, res, next);
                    v[method].apply(v, req.body);
                });
            });
        });
        let defaultProps = {
            writable: false,
            enumerable: false,
            configurable: false
        };

        Object.defineProperties(this, {
            app: Object.assign({
                value: app
            }, defaultProps),
            mappings: Object.assign({
                value: mappings
            }, defaultProps),
            mappingsURI: Object.assign({
                value: mappingsURI
            }, defaultProps)
        });

        Object.seal(this);
        this.app.post(this.mappingsURI, (req, res) => res.json(this.mappings));
    }
}