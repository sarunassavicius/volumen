const env = process.env.NODE_ENV;
const path = require("path");
const context = __dirname;
const extractTextPlugin = require(__dirname + "/node_modules/extract-text-webpack-plugin");
const uglifyJsPlugin = require(__dirname + "/node_modules/uglifyjs-webpack-plugin");
const optimizeCssAssetsPlugin = require(__dirname + "/node_modules/optimize-css-assets-webpack-plugin");
const cssNano = require(__dirname + "/node_modules/cssnano");

module.exports = (env, argv) => {
    console.log("Mode is: " + argv.mode);
    console.log("Dir name is: " + __dirname);
    console.log("Context is: " + context);

    return {
        mode: argv.mode,
        context: __dirname + "/Application",

        entry: {
            app: "./Application.tsx"
        },
        output: {
            filename: env === "production" ? "js/[name].min.js" : "js/[name].js",
            path: __dirname + "/bin"
        },

        devtool: "inline-module-source-map",

        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            "alias": {
                "react": "preact-compat",
                "react-dom": "preact-compat"
            }
        },

        stats: {
            colors: true
        },

        module: {
            rules: [
                { test: /\.tsx?$/, loader: "ts-loader" },
                {
                    enforce: "pre",
                    test: /\.js$/,
                    loader: "source-map-loader"
                },
                {
                    test: /\.(s*)css$/,
                    use: extractTextPlugin.extract({
                        fallback: "style-loader",
                        use: ["css-loader", "sass-loader"]
                    })
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [{
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "/fonts",
                            publicPath: "../fonts"
                        }
                    }]
                },
                {
                    test: /\.(png)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [{
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "/images",
                            publicPath: "../images"
                        }
                    }]
                }
            ]
        },

        plugins: [
            new extractTextPlugin({ filename: env === "production" ? "css/[name].min.css" : "css/[name].css" }),
            new optimizeCssAssetsPlugin({
                assetNameRegExp: /\.optimize\.css$/g,
                cssProcessor: env === "production" ? cssNano : null,
                cssProcessorPluginOptions: {
                    preset: ["default", {
                        discardComments: { removeAll: true }
                    }]
                },
                canPrint: true
            })
        ],

        optimization: {
            minimize: argv.mode === "production",
            minimizer: [
                new uglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    extractComments: false,
                    uglifyOptions: {
                        mangle: true,
                        output: {
                            comments: false
                        }
                    },
                    exclude: [/\.min\.js$/gi]
                })
            ]
        },

        watch: true,
        target: "electron-renderer"
    }
};