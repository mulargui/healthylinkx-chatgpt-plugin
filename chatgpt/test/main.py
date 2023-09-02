# https://github.com/openai/plugins-quickstart

import requests
import os

from flask import Flask, Response, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)

PORT = 3333

# Note: Setting CORS to allow chat.openapi.com is required for ChatGPT to access your plugin
CORS(app, origins=[f"http://localhost:{PORT}", "https://chat.openai.com"])

api_url = 'https://x73rkqly3c.execute-api.us-east-1.amazonaws.com/prod'

@app.route('/.well-known/ai-plugin.json')
def serve_manifest():
    return send_from_directory(os.path.dirname(__file__) + '/../src/.well-known', 'ai-plugin.json', mimetype='Content-Type: application/json')

@app.route('/openapi.yaml')
def serve_openapi_yaml():
    return send_from_directory(os.path.dirname(__file__) + '/../src', 'openapi.yaml', mimetype='Content-Type: text/yaml')

#@app.route('/openapi.json')
def serve_openapi_json():
    return send_from_directory(os.path.dirname(__file__) + '/../src', 'openapi.json',  mimetype='Content-Type: application/json')

@app.route('/logo.png')
def serve_logo():
    return send_from_directory(os.path.dirname(__file__)  + '/../src', 'logo.png', mimetype='Content-Type: image/png')

@app.route('/<path:path>', methods=['GET', 'POST'])
def wrapper(path):

    headers = {
    'Content-Type': 'application/json',
    }

    url = f'{api_url}/{path}'
    print(f'Forwarding call: {request.method} {path} -> {url}')

    if request.method == 'GET':
        response = requests.get(url, headers=headers, params=request.args)
    elif request.method == 'POST':
        response = requests.post(url, headers=headers, params=request.args, json=request.json)
    else:
        raise NotImplementedError(f'Method {request.method} not implemented in wrapper for {path=}')
    return response.content


if __name__ == '__main__':
    app.run(port=PORT)