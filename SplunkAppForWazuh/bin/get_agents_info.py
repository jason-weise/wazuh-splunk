#!/opt/splunk/bin/python
############################################################
#
# GET /agents/agents
#
############################################################
import sys
import splunk.Intersplunk as si
import requests
import json

try:
    #pass
    results = []
    request = requests.get("http://10.0.0.90:8000/en-US/custom/wazuh/agents/agents_info")
    # print request.text
    data = json.loads(request.text)
except Exception as err:
        import traceback
        print err
        stack = traceback.format_exc()
        data = si.generateErrorResults("Error : Traceback: " + str(stack))

si.outputResults(data)