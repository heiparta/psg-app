/*jshint ignore:start */

var _ = require('lodash');
var EventEmitter = require('events');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('util');

import { Link } from 'react-router-dom'

var Auth = function () {
};

util.inherits(Auth, EventEmitter);

Auth.prototype.getToken = function () {
  return localStorage.getItem('token');
};

Auth.prototype.getName = function () {
  return localStorage.getItem('name');
};

Auth.prototype.setToken = function (token, user) {
  if (!token) {
    // LocalStorage stores values as strings and we don't want to store stringified "undefined"
    token = '';
  }
  localStorage.setItem('token', token);
  if (user) {
    localStorage.setItem('username', user.username);
    localStorage.setItem('name', user.name);
  } else {
    localStorage.setItem('username', "");
    localStorage.setItem('name', "");
  }
  this.emit('loginEvent', localStorage.getItem('token') ? true : false);
};

Auth.prototype.loggedIn = function () {
  return Boolean(localStorage.getItem('token'));
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
    var name = auth.getName();
    return <p>Logged in as {name} <Link to="/logout">Log out</Link></p>
  }
});

var LoginForm = React.createClass({
  getInitialState: function () {
    return {username: '', password: '', error: ''};
  },
  login: function (event) {
    event.preventDefault();
    $.ajax({
      type: "POST",
      url: PSG_API_URL + "/login",
      crossDomain: true,
      data: JSON.stringify({username: this.state.username, password: this.state.password}),
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ username: '', password: '' });
        auth.setToken(data.data.token, data.data.user);
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

