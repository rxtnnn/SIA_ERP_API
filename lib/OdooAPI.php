<?php
/**
 * Odoo API Connection Class using JSON-RPC
 */
class OdooAPI {
    private $url;
    private $db;
    private $username;
    private $apikey;
    private $uid;
    private $lastError = '';
    
    /**
     * Constructor
     * 
     * @param string $url Odoo instance URL
     * @param string $db Database name
     * @param string $username User email or login
     * @param string $apikey API key or password
     */
    public function __construct($url, $db, $username, $apikey) {
        $this->url = rtrim($url, '/');
        $this->db = $db;
        $this->username = $username;
        $this->apikey = $apikey;
        
        // Authenticate immediately
        $this->uid = $this->authenticate();
    }
    
    /**
     * Get the last error message
     * 
     * @return string Last error message
     */
    public function getLastError() {
        return $this->lastError;
    }
    
    /**
     * Make a JSON-RPC request
     * 
     * @param string $url Endpoint URL
     * @param array $params Request parameters
     * @return array|bool Response data if successful, false otherwise
     */
    private function jsonRpcRequest($url, $params) {
        $data = array(
            'jsonrpc' => '2.0',
            'method' => 'call',
            'params' => $params,
            'id' => mt_rand(1, 999999)
        );
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $this->lastError = 'cURL error: ' . curl_error($ch) . ' (Code: ' . $httpCode . ')';
            curl_close($ch);
            return false;
        }
        
        curl_close($ch);
        $result = json_decode($response, true);
        
        if (!$result) {
            $this->lastError = 'Invalid JSON response';
            return false;
        }
        
        if (isset($result['error'])) {
            $error = $result['error'];
            $this->lastError = 'Odoo error: ' . $error['message'];
            if (isset($error['data']) && isset($error['data']['message'])) {
                $this->lastError .= ' - ' . $error['data']['message'];
            }
            return false;
        }
        
        return isset($result['result']) ? $result['result'] : false;
    }
    
    /**
     * Authenticate with Odoo using external API
     * 
     * @return int|bool User ID if successful, false otherwise
     */
    private function authenticate() {
        $params = array(
            'service' => 'common',
            'method' => 'login',
            'args' => array(
                $this->db,
                $this->username,
                $this->apikey
            )
        );
        
        $result = $this->jsonRpcRequest($this->url . '/jsonrpc', $params);
        
        if ($result === false) {
            return false;
        }
        
        return $result;
    }
    
    /**
     * Check if connection is valid
     * 
     * @return bool True if connected, false otherwise
     */
    public function isConnected() {
        return $this->uid !== false;
    }
    
    /**
     * Execute a method on a model
     * 
     * @param string $model Model name
     * @param string $method Method name
     * @param array $args Method arguments
     * @return mixed Method result if successful, false otherwise
     */
    public function execute($model, $method, $args = array()) {
        $params = array(
            'service' => 'object',
            'method' => 'execute',
            'args' => array_merge(array(
                $this->db,
                $this->uid,
                $this->apikey,
                $model,
                $method
            ), $args)
        );
        
        return $this->jsonRpcRequest($this->url . '/jsonrpc', $params);
    }
    
    /**
     * Search for records
     * 
     * @param string $model Model name
     * @param array $criteria Search criteria
     * @return array|bool Array of IDs if successful, false otherwise
     */
    public function search($model, $criteria = array()) {
        return $this->execute($model, 'search', array($criteria));
    }
    
    /**
     * Read records
     * 
     * @param string $model Model name
     * @param array $ids Record IDs to read
     * @param array $fields Fields to fetch (empty for all)
     * @return array|bool Record data if successful, false otherwise
     */
    public function read($model, $ids, $fields = array()) {
        return $this->execute($model, 'read', array($ids, $fields));
    }
    
    /**
     * Search and read records in one call
     * 
     * @param string $model Model name
     * @param array $criteria Search criteria
     * @param array $fields Fields to fetch (empty for all)
     * @param int $offset Number of records to skip (pagination)
     * @param int $limit Maximum number of records (0 for no limit)
     * @return array|bool Record data if successful, false otherwise
     */
    public function searchRead($model, $criteria = array(), $fields = array(), $offset = 0, $limit = 0) {
        return $this->execute($model, 'search_read', array($criteria, $fields, $offset, $limit));
    }
    
    /**
     * Count records
     * 
     * @param string $model Model name
     * @param array $criteria Search criteria
     * @return int|bool Count if successful, false otherwise
     */
    public function searchCount($model, $criteria = array()) {
        return $this->execute($model, 'search_count', array($criteria));
    }
    
    /**
     * Create a record
     * 
     * @param string $model Model name
     * @param array $data Record data
     * @return int|bool New record ID if successful, false otherwise
     */
    public function create($model, $data) {
        return $this->execute($model, 'create', array($data));
    }
    
    /**
     * Update records
     * 
     * @param string $model Model name
     * @param array $ids Record IDs to update
     * @param array $data New data
     * @return bool True if successful, false otherwise
     */
    public function write($model, $ids, $data) {
        return $this->execute($model, 'write', array($ids, $data));
    }
    
    /**
     * Delete records
     * 
     * @param string $model Model name
     * @param array $ids Record IDs to delete
     * @return bool True if successful, false otherwise
     */
    public function unlink($model, $ids) {
        return $this->execute($model, 'unlink', array($ids));
    }
    
    /**
     * Get fields of a model
     * 
     * @param string $model Model name
     * @return array|bool Field definitions if successful, false otherwise
     */
    public function getFields($model) {
        return $this->execute($model, 'fields_get', array(array(), array('string', 'help', 'type')));
    }
}