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
        post(mappingsURI).then(classes => {
            let constructedClasses = Object.create(null);
            for (let className in classes) {
                let cls = classes[className];
                let methods = Object.create(null);

                for (let method in cls) {
                    let path = cls[method];
                    setReadOnly(methods, method, function() {
                        return post(path, Array.prototype.slice.call(arguments));
                    });
                }
                
                Object.seal(methods);
                setReadOnly(constructedClasses, className, methods);
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