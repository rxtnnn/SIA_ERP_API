<?php
// OdooConnector.php
require_once 'vendor/autoload.php'; // Assuming you're using Composer for XML-RPC

class OdooConnector {
    private $url;
    private $db;
    private $username;
    private $password;
    private $uid;
    private $client;
    
    public function __construct($url, $db, $username, $password) {
        $this->url = $url;
        $this->db = $db;
        $this->username = $username;
        $this->password = $password;
        $this->authenticate();
    }
    
    private function authenticate() {
        $common = new \Ripcord\Client($this->url . '/xmlrpc/2/common');
        $this->uid = $common->authenticate($this->db, $this->username, $this->password, array());
        
        if (!$this->uid) {
            throw new Exception('Authentication failed');
        }
        
        $this->client = new \Ripcord\Client($this->url . '/xmlrpc/2/object');
    }
    
    public function execute($model, $method, $params = array()) {
        return $this->client->execute_kw(
            $this->db, 
            $this->uid, 
            $this->password,
            $model, 
            $method, 
            $params
        );
    }
}