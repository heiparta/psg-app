/*jshint ignore:start */

var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom');


var Login = React.createClass({
  getInitialState: function () {
    return {username: '', password: '', token: null}
  },
  login: function (event) {
    event.preventDefault();
    console.log("LOGIN", this.state.username, this.state.password);
    $.ajax({
      type: "POST",
      url: PSG_API_URL + "/player/token",
      crossDomain: true,
      data: {name: this.state.username, password: this.state.password},
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ username: '', password: '', token: data.token });
        console.log("TOKEN", this.state.token);
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });

  },
  loggedIn: function () {
    return this.state.loggedIn;
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
      </form>
    );
  }
});

export default Login;


/*jshint ignore:end */

