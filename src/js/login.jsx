/*jshint ignore:start */

var _ = require('lodash');
var EventEmitter = require('events');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('util');

import { Link } from 'react-router'

var Auth = function () {
};

Auth.prototype.getToken = function () {
  return localStorage.token;
};

util.inherits(Auth, EventEmitter);

Auth.prototype.setToken = function (token, user) {
  if (!token) {
    // LocalStorage stores values as strings and we don't want to store stringified "undefined"
    token = '';
  }
  localStorage.token = token;
  this.username = user;
  this.emit('loginEvent', localStorage.token ? true : false);
};

Auth.prototype.loggedIn = function () {
  return localStorage.token ? true : false;
};

export var auth = new Auth();

export var Logout = React.createClass({
  componentDidMount: function () {
    auth.setToken();
  },
  render: function() {
    return <p>You are now logged out</p>
  }
});

var Logged = React.createClass({
  render: function() {
    return <p>Logged in as {auth.username} <Link to="/logout">Log out</Link></p>
  }
});

var LoginForm = React.createClass({
  getInitialState: function () {
    return {username: '', password: '', error: ''}
  },
  login: function (event) {
    event.preventDefault();
    $.ajax({
      type: "POST",
      url: PSG_API_URL + "/player/token",
      crossDomain: true,
      data: {name: this.state.username, password: this.state.password},
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ username: '', password: '' });
        auth.setToken(data.token, data.user);
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
        auth.setToken();
        this.setState({error: err.toString()});
      }.bind(this),
    });

  },
  logout: function () {
    auth.setToken();
  },
  handleChange: function(event) {
    var newState = {};
    newState[event.target.name] = event.target.value;
    this.setState(newState);
  },
  render: function() {
    return (
      <form className="form-inline" role="form" >
        <div className="form-group">
          <input name="username" type="text" onChange={this.handleChange} value={this.state.username} placeholder="Username" />
          <input name="password" type="password" onChange={this.handleChange} value={this.state.password} placeholder="Password" />
        </div>
        <button type="submit" className="btn btn-primary" onClick={this.login}>Login</button>
        {this.state.error && (
          <p>{this.state.error}</p>)}
      </form>
    );
  }
});

export var Login = React.createClass({
  getInitialState: function () {
    return { loggedIn: auth.loggedIn() };
  },
  handleLoginEvent: function (loggedIn) {
    this.setState({loggedIn: loggedIn });
  },
  componentWillMount: function () {
    auth.on('loginEvent', this.handleLoginEvent);
  },
  render() {
    return (
      <div>
      { this.state.loggedIn ? <Logged /> : <LoginForm /> }
      </div>
    );
  }
});

/*jshint ignore:end */

