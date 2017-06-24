# once-api

once-api allows you to write your logic once in the backend, it will dynamically generate classes for the frontend.

I am a full stack developer, lots of my time was spent on connecting my web app's frontend and backend.
So I develop once-api to save my time. It generates an expressjs app and reads request body using expressjs/body-parser

To Install: `npm install once-api --save`

To start with, you need to implement a view class extending View
```es6
// MyView.js
import View from "once-api/backend/view";

export default class MyView extends View { //this class will be instanciated on each request
    greet(name){
        this.res.json(`Hello, ${name}!`); // this will be the resolved value in frontend
        // you can also access the req / next object using this.req / this.next
    }
}
```

Then you need to instanciate OnceAPI (backend) with your views in a list.
```es6
// index.js
import OnceAPI from "once-api/backend";
import MyView from "./MyView";

const myAPI = new OnceAPI([MyView]); //pass in prefix here if you're using it as a sub app
const app = myAPI.app; //this is the express app

app.listen(8000, () => console.log("OnceAPI running on port 8000"));
```

Lastly in the frontend:

```es6
//frontend.js
import OnceAPI from "once-api/frontend";

OnceAPI().ready.then(classes => {
    let {MyView} = classes;
    MyView.greet("Aaron").then(result => alert(result));
});

```

After that, run your backend code using babel-node and transpile your frontend.js, you should see "Hello, Aaron!" pop up in your browser.
