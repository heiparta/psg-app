/*global $ */
"use strict";

import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Modal from "react-modal";

import * as dragula from 'react-dragula';
import * as Plotly from 'react-plotlyjs';

import createBrowserHistory from 'history/lib/createBrowserHistory';
import { Router, Route, Link, IndexRoute } from 'react-router';

import { Login, Logout, auth } from './login';

var modalStyle = {
  content: {
    top                   : '25%',
    //width                 : '80%',
    left                  : '25%',
    right                 : '25%',
    bottom                : 'auto',
    //marginRight           : '-25%',
    //transform             : 'translate(-25%, -25%)'
  }
};

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
      url: window.PSG_API_URL + "/player/" + this.props.params.name,
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
      <div className="row playerDiv">
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
    var numberOfLosses = (this.props.stats.numberOfGames - this.props.stats.numberOfWins) || 0;
    return (
      <tr>
        <th><Link to={"/player/" + this.props.name}>{this.props.name}</Link></th>
        <td>{this.props.stats.numberOfGames}</td>
        <td>{this.props.stats.numberOfWins}</td>
        <td>{numberOfLosses}</td>
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
      </div>
    );
  }
});

var GameRow = React.createClass({
  render: function() {
    var awayTeam = this.props.game.playersAway.join(', ');
    var homeTeam = this.props.game.playersHome.join(', ');
    var dateString = new Date(this.props.game.date).toDateString();
    return (
      <tr title={dateString}>
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
      rows.push(<GameRow key={game.id} game={game} />);
    });
    if (_.isEmpty(rows)) {
      return (
        <div className="container">
        </div>
      );
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
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
});

var GameDragSourceContainer = React.createClass({
  render: function () {
    return (
      <div className={"col-sm-" + (this.props.width || 4) + " " + (this.props.extraClass || "")}>
        {this.props.players}
      </div>
    );
  },
});
var GameDragTargetContainer = React.createClass({
  render: function () {
    return (
      <div className={"col-sm-" + (this.props.width || 4) + " " + (this.props.extraClass || "")}>
        {this.props.players}
      </div>
    );
  },
});

var GameDragForm = React.createClass({
  getInitialFormState: function () {
    return {
      modalIsOpen: false,
      state: "",
      playersHome: [],
      playersAway: [],
      playersIdle: _.map(this.props.players, 'name'),
    };
  },
  getInitialState: function () {
    return _.merge({
      drake: dragula(),
      dragContainers: {}
    }, this.getInitialFormState());
  },
  addComponentToDrake: function (item) {
    if (!item) {
      return;
    }
    var domNode = ReactDOM.findDOMNode(item);
    this.state.dragContainers[item.props.playerSink] = domNode;
    this.state.drake.containers.push(domNode);
  },
  onDraggableClick: function (name) {
    var self = this;
    var dragItem = self.refs["dragItem" + name];
    var sourceContainer = document.querySelector(".dragSource");
    var sourceSink, targetSink;
    var newState = _.pick(self.state, ["playersIdle", "playersHome", "playersAway"]);

    if (dragItem.parentElement === sourceContainer) {
      return;
    }

    // Update state by moving the player back to dragSource
    _.forOwn(self.state.dragContainers, function (o, playerSink) {
      if (o === dragItem.parentElement) {
        sourceSink = playerSink;
      }
      if (o === sourceContainer) {
        targetSink = playerSink;
      }
    });
    if (targetSink !== sourceSink) {
      _.pull(newState[sourceSink], name);
      newState[targetSink].push(name);
      self.setState(newState);
    }
  },
  openModal: function () {
    this.setState({modalIsOpen: true});
  },
  closeModal: function () {
    this.setState(this.getInitialFormState());
  },
  componentDidMount: function () {
    var self = this;

    // Update state on drop event
    this.state.drake.on('drop', function (el, target, source, sibling) {
      var sourceSink, targetSink;
      var newState = _.pick(self.state, ["playersIdle", "playersHome", "playersAway"]);
      self.state.drake.cancel(true);

      _.forOwn(self.state.dragContainers, function (o, playerSink) {
        if (o === source) {
          sourceSink = playerSink;
        }
        if (o === target) {
          targetSink = playerSink;
        }
      });
      if (targetSink !== sourceSink) {
        _.pull(newState[sourceSink], el.textContent);
        newState[targetSink].push(el.textContent);
        self.setState(newState);
      }
    });

  },
  sendFormData: function () {
    var data = {
      teamHome: this.state.teamHome,
      teamAway: this.state.teamAway,
      goalsHome: this.state.goalsHome,
      goalsAway: this.state.goalsAway,
      playersHome: _.map(this.state.playersHome, _.trim).join(','),
      playersAway: _.map(this.state.playersAway, _.trim).join(','),
      series: this.props.series,
    };
    if (_.some(data, _.isEmpty)) {
      this.setState({error: "Check the game data"});
      return;
    }
    $.ajax({
      type: "POST",
      url: window.PSG_API_URL + "/game",
      data: data,
      dataType: 'json',
      success: function (data) {
        this.closeModal();
        this.props.onGameChange();
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  handleSubmit: function(event) {
    event.preventDefault();
    this.setState({state: "Sending"}, this.sendFormData);
  },
  handleChange: function(event) {
    var newState = {};
    newState[event.target.name] = event.target.value;
    this.setState(newState);
  },
  render: function () {
    var self = this;
    var playerList = function (players) {
      return _.map(players, function (p) {
        return (
          <span onClick={self.onDraggableClick.bind(self, p)} key={p} ref={"dragItem" + p} className={"dragItem btn btn-info dragItem" + p}>{p}</span>
        );
      });
    };

    return (
      <div className="container">
        <button className="btn btn-info" onClick={this.openModal}>Add new game</button>
        <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal} style={modalStyle}>
          <h4>Drag players to teams. Clicking on a player removes him from the team.</h4>
          <div className="row">
            <GameDragSourceContainer playerSink="playersIdle" ref={this.addComponentToDrake} width="12" extraClass="text-center dragSource" players={playerList(this.state.playersIdle)} />
          </div>
          <form role="form-horizontal" action="" onSubmit={this.handleSubmit}>
            <div className="row dragRow">
              <GameDragTargetContainer playerSink="playersAway" ref={this.addComponentToDrake} extraClass="dragContainer" players={playerList(this.state.playersAway)} />
              <div className="col-sm-2 form-group">
                <label htmlFor="teamAway">Away team</label>
                <input name="teamAway" className="form-control" type="text" size="4" onChange={this.handleChange} value={this.state.teamAway} />
                <label htmlFor="goalsAway">Goals</label>
                <input name="goalsAway" className="form-control" type="text" size="2" onChange={this.handleChange} value={this.state.goalsAway} />
              </div>
              <div className="col-sm-2 text-right form-group">
                <label htmlFor="teamHome">Home team</label>
                <input name="teamHome" className="form-control" type="text" size="4" onChange={this.handleChange} value={this.state.teamHome} />
                <label htmlFor="goalsHome">Goals</label>
                <input name="goalsHome" className="form-control" type="text" size="2" onChange={this.handleChange} value={this.state.goalsHome} />
              </div>
              <GameDragTargetContainer playerSink="playersHome" ref={this.addComponentToDrake} extraClass="dragContainer" players={playerList(this.state.playersHome)} />
            </div>
            <span className="text-warning">{this.state.error}</span>
            <div className="form-group text-center">
              <button onClick={this.closeModal} className="btn btn-link">Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
});

var SeriesStatsChooser = React.createClass({
  handleTabClick: function (item) {
    this.props.onTabClick(item);
  },
  render: function () {
    var self = this;
    var tabs = this.props.tabs.map(function (item) {
      return <li key={item.key} className={self.props.activeTabId === item.key ? 'active' : ''}><a href="#" onClick={self.handleTabClick.bind(self, item.key)}>{item.name}</a></li>;
    });
    return (
        <ul className="nav nav-pills">
          {tabs}
        </ul>
    );
  },
});

var Series = React.createClass({
  getInitialState: function () {
    var games = [];
    return {
      name: "",
      players: [],
      games: games,
      tabs: [
        {name: "Current month", key:"current"},
        {name: "All time", key:"alltime"},
      ],
      activeTabId: "current",
    };
  },
  onTabClick: function (item) {
    if (this.state.activeTabId !== item) {
      this.setState({activeTabId: item});
    }
  },
  getSeriesStats: function () {
    var data;
    if (this.state.activeTabId === "current") {
      data = {
        stats_days: (new Date()).getDate()
      };
    }
    $.ajax({
      url: window.PSG_API_URL + "/series/" + this.props.params.name,
      data: data,
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ name: data.series.name, players: data.series.players });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.activeTabId !== prevState.activeTabId) {
      this.getSeriesStats();
    }
  },
  refreshStats: function () {
    this.getSeriesStats();
    $.ajax({
      url: window.PSG_API_URL + "/series/" + this.props.params.name + "/games",
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
  componentDidMount: function () {
    this.refreshStats();
  },
  render: function() {
    if (_.isEmpty(this.state.players)) {
      return (
        <div className="seriesDiv">
        </div>
      );
    }
    return (
      <div className="container">
        <h2>{this.state.name}</h2>
        <SeriesStatsChooser tabs={this.state.tabs} activeTabId={this.state.activeTabId} onTabClick={this.onTabClick} />
        <PlayerList players={this.state.players} />
        <PlayerStreakGraph players={this.state.players} />
        <GameList games={this.state.games} />
        { auth.loggedIn() ? <GameDragForm onGameChange={this.refreshStats} series={this.state.name} players={this.state.players} /> : null }
      </div>
    );
  }
});

var SeriesListRow = React.createClass({
  render() {
    return (
        <li><Link to={"/series/" + this.props.name}>{this.props.name}</Link></li>
    );
  }
});

var SeriesList = React.createClass({
  render() {
    var rows = _.map(this.props.series, function (s) {
      return (
        <SeriesListRow key={s} name={s} />
      );
    });
    return (
        <ul>
          {rows}
        </ul>
    );
  }
});

var App = React.createClass({
  getInitialState: function () {
    return { series: [] };
  },
  componentDidMount: function () {
    $.ajax({
      url: window.PSG_API_URL + "/series",
      dataType: 'json',
      cache: false,
      success: function (data) {
        this.setState({ series: data.data });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  render() {
    return (
      <div>
      <Login />
      <h1>PSG stats</h1>
      <SeriesList series={this.state.series} />

      {this.props.children}
      </div>
    );
  }
});

ReactDOM.render((
  <Router history={createBrowserHistory()}>
    <Route path="/" component={App}>
      <Route path="logout" component={Logout} />
      <Route path="series/:name" component={Series} />
      <Route path="player/:name" component={Player} />
    </Route>
  </Router>
), document.getElementById('content'));

