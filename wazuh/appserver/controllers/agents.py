import logging
import os
import sys
import json
import requests
import re
# from splunk import AuthorizationFailed as AuthorizationFailed
import splunk.appserver.mrsparkle.controllers as controllers
import splunk.appserver.mrsparkle.lib.util as util
from splunk.appserver.mrsparkle.lib.util import make_splunkhome_path
from splunk.appserver.mrsparkle.lib.decorators import expose_page
_APPNAME = 'wazuh'
def setup_logger(level):
    """
    Setup a logger for the REST handler.
    """
    logger = logging.getLogger('splunk.appserver.%s.controllers.agents' % _APPNAME)
    logger.propagate = False  # Prevent the log messages from being duplicated in the python.log file
    logger.setLevel(level)
    file_handler = logging.handlers.RotatingFileHandler(make_splunkhome_path(['var', 'log', 'splunk', 'agents.log']), maxBytes=25000000, backupCount=5)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger
logger = setup_logger(logging.DEBUG)
class agents(controllers.BaseController):

    # /custom/wazuh/agents/filescontent?id=idgroup&filename=agent.conf
    @expose_page(must_login=False, methods=['GET'])
    def filescontent(self,**kwargs):
        group_id = re.split(r'[\/\\]+', kwargs['id'])[-1]
        filename = re.split(r'[\/\\]+', kwargs['filename'])[-1]
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents/groups/' + group_id + '/files/' + filename, auth=auth, verify=verify)
        files = [json.loads(request.text)]
        return json.dumps(files)

    # /custom/wazuh/agents/files?id=idgroup
    @expose_page(must_login=False, methods=['GET'])
    def files(self,**kwargs):
        group_id = re.split(r'[\/\\]+', kwargs['id'])[-1]
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents/groups/' + group_id + '/files', auth=auth, verify=verify)
        files_qty = json.loads(request.text)["data"]["totalItems"]
        request = requests.get(opt_base_url + '/agents/groups/' + group_id + '/files?offset=0&limit=' + str(files_qty), auth=auth, verify=verify)
        files = json.loads(request.text)["data"]["items"]
        return json.dumps(files)

    # /custom/wazuh/agents/groups
    @expose_page(must_login=False, methods=['GET'])
    def groups(self,**kwargs):
        group_id = re.split(r'[\/\\]+', kwargs['id'])[-1]
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents/groups/' + group_id, auth=auth, verify=verify)
        groups_qty = json.loads(request.text)["data"]["totalItems"]
        request = requests.get(opt_base_url + '/agents/groups/' + group_id + '?offset=0&limit=' + str(groups_qty), auth=auth, verify=verify)
        groups = json.loads(request.text)["data"]["items"]
        return json.dumps(groups)

    # /custom/wazuh/agents/summary
    @expose_page(must_login=False, methods=['GET'])
    def summary(self, **kwargs):
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents/summary', auth=auth, verify=verify)
        agent_summary = json.loads(request.text)['data']
        data = {}
        for key in agent_summary:
            data['agent_summary_' + key.lower().replace(' ', '')] = agent_summary[key]
        data = [data]
        result = json.dumps(data)
        return result

    @expose_page(must_login=False, methods=['GET'])
    def agents_info(self, **kwargs):
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents?limit=0', auth=auth, verify=verify)
        agents_qty = json.loads(request.text)["data"]["totalItems"]
        request = requests.get(opt_base_url + '/agents?offset=0&limit=' + str(agents_qty), auth=auth, verify=verify)
        agents = json.loads(request.text)["data"]["items"]
        results = []
        for agent in agents:
            data = {}
            for attribute, value in agent.iteritems():
                if attribute == 'os':
                    for key,val in agent['os'].iteritems():
                        data['os-'+key] = val
                else:
                    data[attribute] = value 
            
            request = requests.get(opt_base_url + '/rootcheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            rootcheck_lastscan = json.loads(request.text)["data"]["start"]

            request = requests.get(opt_base_url + '/syscheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            syscheck_lastscan = json.loads(request.text)["data"]["start"]

            data["last_rootcheck"] = rootcheck_lastscan
            data["last_syscheck"] = syscheck_lastscan
            
            results.append(data)
        return json.dumps(results)
        
    # /custom/wazuh/agents/agentschecks
    @expose_page(must_login=False, methods=['GET'])
    def agents_checks(self, **kwargs):
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents?limit=0', auth=auth, verify=verify)
        agents_qty = json.loads(request.text)["data"]["totalItems"]
        request = requests.get(opt_base_url + '/agents?offset=0&limit=' + str(agents_qty), auth=auth, verify=verify)
        agents = json.loads(request.text)["data"]["items"]
        results = []
        for agent in agents:
            data = {}
            for attribute, value in agent.iteritems():
                if attribute == 'os':
                    for key,val in agent['os'].iteritems():
                        data['os-'+key] = val
                else:
                    data[attribute] = value 
            
            request = requests.get(opt_base_url + '/rootcheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            rootcheck_lastscan = json.loads(request.text)["data"]["start"]

            request = requests.get(opt_base_url + '/syscheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            syscheck_lastscan = json.loads(request.text)["data"]["start"]

            data["last_rootcheck"] = rootcheck_lastscan
            data["last_syscheck"] = syscheck_lastscan

            results.append(data)
        return json.dumps(results)
    
    # /custom/wazuh/agents/agentschecks
    @expose_page(must_login=False, methods=['GET'])
    def agents(self, **kwargs):
        opt_username = 'foo'
        opt_password = 'bar'
        opt_base_url = 'http://10.0.0.83:55000'
        auth = requests.auth.HTTPBasicAuth(opt_username, opt_password)
        verify = False
        request = requests.get(opt_base_url + '/agents?limit=0', auth=auth, verify=verify)
        agents_qty = json.loads(request.text)["data"]["totalItems"]
        request = requests.get(opt_base_url + '/agents?offset=0&limit=' + str(agents_qty), auth=auth, verify=verify)
        agents = json.loads(request.text)["data"]["items"]
        results = []
        for agent in agents:
            data = {}
            for attribute, value in agent.iteritems():
                if attribute == 'os':
                    for key,val in agent['os'].iteritems():
                        data['os-'+key] = val
                else:
                    data[attribute] = value 
            
            request = requests.get(opt_base_url + '/rootcheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            rootcheck_lastscan = json.loads(request.text)["data"]["start"]

            request = requests.get(opt_base_url + '/syscheck/' + agent["id"] + '/last_scan', auth=auth, verify=verify)
            syscheck_lastscan = json.loads(request.text)["data"]["start"]

            data["last_rootcheck"] = rootcheck_lastscan
            data["last_syscheck"] = syscheck_lastscan
            
            results.append(data)
        return json.dumps(results)