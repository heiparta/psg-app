/*jshint ignore:start */

var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom');

var Plotly = require('react-plotlyjs');

import { Router, Route, Link } from 'react-router'

var PlayerStatsRow = React.createClass({
  render: function() {
    var numberOfLosses = (this.props.stats.numberOfGames - this.props.stats.numberOfWins) || undefined;
    return (
      <tr>
        <td>{this.props.name}</td>
        <td>{this.props.stats.numberOfGames}</td>
        <td>{this.props.stats.numberOfWins}</td>
        <td>{numberOfLosses}</td>
        <td>{this.props.stats.winPercentage + " %"}</td>
        <td>{this.props.stats.currentStreak}</td>
      </tr>
    );
  }
});

var PlayerStatsTable = React.createClass({
  render: function() {
    var rows = [];
    this.props.players.forEach(function (player) {
      rows.push(<PlayerStatsRow key={player.name} name={player.name} stats={player.stats} />);
    });
    return (
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Games</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win percentage</th>
            <th>Current streak</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
});

var Player = React.createClass({
  getInitialState: function () {
    return { player: { stats: {}, name: "" }, name: "", series: [] };
  },
  componentDidMount: function () {
    $.ajax({
      url: "http://localhost:8080/player/" + this.props.params.name,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ player: data.player, name: data.player.name });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  render: function() {
    return (
      <div className="playerDiv">
        <h1>{this.state.name}</h1>
        <PlayerStatsTable players={[this.state.player]} />
      </div>
    );
  }
});

var PlayerStreakGraph = React.createClass({
  render: function() {
    var sortedPlayers = _.sortBy(this.props.players, 'stats.currentStreak');
    var data = [
        {
          type: "bar",
          y: _.map(sortedPlayers, function (p) {
            return p.stats.currentStreak < 0 ? p.name : undefined;
          }),
          x: _.map(sortedPlayers, function (p) {
            return p.stats.currentStreak < 0 ? p.stats.currentStreak : undefined;
          }),
          name: "Losing streak",
          orientation: "h",
          marker: {
            color: "rgb(240, 20, 20)",
          },
        },
        {
          type: "bar",
          y: _.map(sortedPlayers, function (p) {
            return p.stats.currentStreak >= 0 ? p.name : undefined;
          }),
          x: _.map(sortedPlayers, function (p) {
            return p.stats.currentStreak >= 0 ? p.stats.currentStreak : undefined;
          }),
          name: "Winning streak",
          orientation: "h",
          marker: {
            color: "rgb(20, 240, 20)",
          },
        },
    ];
    var layout = {
      showlegend: false,
    };
    var config = {
      showLink: false,
      displayModeBar: false,
    };
    return (
      <Plotly className="streakGraph" data={data} layout={layout} config={config} />
    );
  }
});

var PlayerListRow = React.createClass({
  render: function() {
    return (
      <tr>
        <th><Link to={"/player/" + this.props.name}>{this.props.name}</Link></th>
        <td>{this.props.stats.numberOfGames}</td>
        <td>{this.props.stats.numberOfWins}</td>
        <td>{this.props.stats.numberOfLosses}</td>
        <td>{this.props.stats.winPercentage + " %"}</td>
      </tr>
    );
  }
});

var PlayerList = React.createClass({
  render: function() {
    var rows = this.props.players.map(function (player) {
      return (
        <PlayerListRow key={player.name} name={player.name} stats={player.stats} />
      );
    });
    return (
      <div className="container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Games</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Winning percentage</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <PlayerStreakGraph players={this.props.players} />
      </div>
    );
  }
});

var GameRow = React.createClass({
  render: function() {
    var awayTeam = this.props.game.playersAway.join(', ');
    var homeTeam = this.props.game.playersHome.join(', ');
    return (
      <tr>
        <td>{awayTeam}</td>
        <td>{this.props.game.teamAway}</td>
        <td>{this.props.game.goalsAway}</td>
        <td>{this.props.game.goalsHome}</td>
        <td>{this.props.game.teamHome}</td>
        <td>{homeTeam}</td>
      </tr>
    );
  }
});

var GameList = React.createClass({
  render: function() {
    var rows = [];
    this.props.games.forEach(function (game) {
      rows.push(<GameRow key={game.teamAway} game={game} />);
    });
    if (_.isEmpty(rows)) {
      return (
        <div className="container">
        </div>
      )
    }
    return (
      <div className="container">
        <h2>Last 5 games in series</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Away team</th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th>Home team</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
});

var Series = React.createClass({
  getInitialState: function () {
    var games = [];
    return { name: "", players: [], games: games };
  },
  componentDidMount: function () {
    $.ajax({
      url: "http://localhost:8080/series/" + this.props.params.name,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ name: data.series.name, players: data.series.players });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
    $.ajax({
      url: "http://localhost:8080/series/" + this.props.params.name + "/games",
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ games: data.games });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  render: function() {
    return (
      <div className="seriesDiv">
        <h2>Players in {this.state.name}</h2>
        <PlayerList players={this.state.players} />
        <GameList games={this.state.games} />

      </div>
    );
  }
});

var App = React.createClass({
  render() {
    return (
      <div>
        <h1>PSG stats</h1>
        <ul>
          <li><Link to="/series/testseries">testseries</Link></li>
        </ul>

        {this.props.children}
      </div>
    )
  }
})

ReactDOM.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="series/:name" component={Series} />
      <Route path="player/:name" component={Player} />
    </Route>
  </Router>
), document.getElementById('content'))

/*jshint ignore:end */

