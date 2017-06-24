const post = (uri, data) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        let errHandler = event => reject(event);
        xhr.addEventListener("load", event => resolve(JSON.parse(event.target.responseText)));
        xhr.addEventListener("error", errHandler);
        xhr.addEventListener("abort", errHandler);
        xhr.open("POST", uri, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(data));
    });
}

const readOnlyProperties = {
    enumerable: false,
    configurable: false,
    writable: false
};

const setReadOnly = (obj, key, value) => {
    Object.defineProperty(obj, key, Object.assign({
        value: value
    }, readOnlyProperties));
};

const OnceAPI = (mappingsURI = "/__mappings__") => {
    let OnceAPI = Object.create(null);
    setReadOnly(OnceAPI, "ready", new Promise((resolve, reject) => {
        post(mappingsURI).then(classes => { // retrieve method->uri mappings
            /** it looks like this:
              * {
              *     "MyView": { // "MyView" here is value of "className" in the following code
              *         "myMethod": "/my-view/my-method"
              *         // "myMethod" is "methodName", and "/my-view/my-method" is "uri"
              *      }
              * }
              */
            let constructedClasses = Object.create(null);
            for (let className in classes) {
                let cls = classes[className];
                let methods = Object.create(null);

                for (let methodName in cls) {
                    let uri = cls[methodName];
                    setReadOnly(methods, methodName, function() {
                        // the method simply returns a promise of the xhr call
                        // arguments are JSON stringified, so all arguments must be JSON serializable
                        return post(uri, Array.prototype.slice.call(arguments));
                    });
                }
                
                Object.seal(methods); // finalize the methods
                setReadOnly(constructedClasses, className, methods);
                // also attach the class to OnceAPI, so it can be invoked like this:
                // OnceAPI.ready(() => OnceAPI.MyClass.myMethod("some arguments"))
                setReadOnly(OnceAPI, className, methods);
            }
            Object.seal(OnceAPI);
            resolve(constructedClasses);
        }, reject);
    }));
    return OnceAPI;
}

export default OnceAPI;
export {OnceAPI};