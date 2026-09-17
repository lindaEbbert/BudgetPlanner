import json
from pathlib import Path

import yaml
from flask import Blueprint, Response, send_from_directory

OPENAPI_DIR = Path(__file__).resolve().parent.parent / 'openapi'

docs_blueprint = Blueprint('docs', __name__)


@docs_blueprint.route('/openapi.json', methods=['GET'])
def get_openapi_spec():
    # Parsed on every request so edits to openapi.yaml show up without a restart.
    with open(OPENAPI_DIR / 'openapi.yaml', encoding='utf-8') as spec_file:
        spec = yaml.safe_load(spec_file)
    # json.dumps keeps the authored key order; jsonify would sort the keys.
    return Response(json.dumps(spec, ensure_ascii=False), mimetype='application/json'), 200


@docs_blueprint.route('/docs', methods=['GET'])
def get_swagger_ui():
    return send_from_directory(OPENAPI_DIR, 'swagger_ui.html')
