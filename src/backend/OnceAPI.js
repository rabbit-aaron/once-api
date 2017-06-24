import express from "express"
import bodyParser from "body-parser";

const getUri = (view, method) => {
    /**
     * Generate url based on View class's name and method name
     * e.g.
     * class MyView extends View {
     *     helloWorld() {
     *     }
     * }
     *
     * MyView.helloWorld would produce my-view/hello-world
     */
    return `/${slugify(view.name)}/${slugify(method)}`;
};

const LETTER_REGEX = /([A-Z])/g;

const slugify = (str) => {
    /**
     *  transform camelCase (or PascalCase) to hyphen-connected case
     *  e.g.: HelloWorld -> hello-world
     */
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
    /**
     * return a list of methods of the view class,
     * excluding the constructor
     */
    return Object.getOwnPropertyNames(viewClass.prototype).filter(
        name => typeof viewClass.prototype[name] === "function" && name !== "constructor"
    );
};

export default class OnceAPI {
    constructor(views, prefix = "", mappingsURI = "/__mappings__") {
        let app = express();
        app.use(bodyParser.json()); //body-parser for parsing arguments
        let uriRegistered = {};
        let mappings = {}; //used to store class/method to uri
        views.forEach(view => {
            mappings[view.name] = {};
            getViewClassMethods(view).forEach(method => {
                let uri = getUri(view, method);
                if (uriRegistered[uri]) {
                    // method name conflicts: e.g. greet and Greet would generate uri "greet"
                    throw `URI conflict detected for ${view.name}.${method} and ${uriRegistered[uri]}: ${uri}`;
                }
                // record class/method for error throwing if conflict dectected
                uriRegistered[uri] = `${view.name}.${method}`;
                mappings[view.name][method] = `${prefix}${uri}`;
                // register the urls
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
        // All these three values are read-only
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

        Object.seal(this); // seal the instance so it can't be changed anymore
        // register the uri for frontend to retrieve the "class/method->uri" mappings
        this.app.post(this.mappingsURI, (req, res) => res.json(this.mappings));
    }
}