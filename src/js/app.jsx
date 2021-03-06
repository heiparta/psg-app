/*global $ */
"use strict";

import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Modal from "react-modal";

import dragula from 'react-dragula';

import createBrowserHistory from 'history/lib/createBrowserHistory';
import { HashRouter as Router, Route, Link } from 'react-router-dom';

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

function mapPlayerNameToKey (name, players) {
  return _.find(players, function (p) {
    return p.name === name;
  }).key;
}

var PlayerStatsRow = React.createClass({
  render: function() {
    var numberOfLosses = (this.props.player.statNumberOfGames - this.props.player.statNumberOfWins) || undefined;
    return (
      <tr>
        <td>{this.props.player.name}</td>
        <td>{this.props.player.stats.games}</td>
        <td>{this.props.player.stats.wins}</td>
        <td>{numberOfLosses}</td>
        <td>{this.props.player.stats.winPercentage + " %"}</td>
        <td>{this.props.player.stats.streak}</td>
      </tr>
    );
  }
});

var PlayerStatsTable = React.createClass({
  render: function() {
    var rows = [];
    this.props.players.forEach(function (player) {
      rows.push(<PlayerStatsRow key={player.name} player={player} />);
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

var PlayerListRow = React.createClass({
  render: function() {
    var numberOfLosses = (this.props.player.stats.games - this.props.player.stats.wins) || 0;
    return (
      <tr>
        <th><Link to={"/player/" + this.props.player.name}>{this.props.player.name}</Link></th>
        <td>{this.props.player.stats.games}</td>
        <td>{this.props.player.stats.wins}</td>
        <td>{numberOfLosses}</td>
        <td>{this.props.player.stats.streak}</td>
        <td>{this.props.player.stats.winPercentage + " %"}</td>
      </tr>
    );
  }
});

var PlayerList = React.createClass({
  render: function() {
    var rows = this.props.players.map(function (player) {
      return (
        <PlayerListRow key={player.name} player={player} />
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
              <th>Streak</th>
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
    var awayTeam = _.map(this.props.game.playersAway, 'name').join(', ');
    var homeTeam = _.map(this.props.game.playersHome, 'name').join(', ');
    var dateString = new Date(this.props.game.range).toDateString();
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
      rows.push(<GameRow key={game.range} game={game} />);
    });
    if (_.isEmpty(rows)) {
      return (
        <div className="container">
        </div>
      );
    }
    return (
      <div className="container">
        <h2>Last 30 games in series</h2>
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
      goalsAway: "",
      goalsHome: "",
      teamAway: "",
      teamHome: "",
      sendButtonDisabled: false,
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
    var self = this;
    var data = {
      teamHome: this.state.teamHome,
      teamAway: this.state.teamAway,
      goalsHome: this.state.goalsHome,
      goalsAway: this.state.goalsAway,
      playersHome: _.map(this.state.playersHome, function (p) { return mapPlayerNameToKey(p, self.props.players);}),
      playersAway: _.map(this.state.playersAway, function (p) { return mapPlayerNameToKey(p, self.props.players);}),
      series: this.props.series,
    };
    var token = auth.getToken();
    if (!token) {
      this.setState({error: "You are not logged in"});
      return;
    }
    if (_.some(data, _.isEmpty) || data.goalsHome === data.goalsAway) {
      this.setState({error: "Check the game data"});
      return;
    }
    this.setState({sendButtonDisabled: true});
    $.ajax({
      type: "POST",
      url: window.PSG_API_URL + "/game",
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json',
      headers: {authorization: "Bearer " + token},
      success: function (data) {
        this.closeModal();
        this.props.onGameChange();
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
        this.setState({sendButtonDisabled: false});
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
  componentWillReceiveProps: function (nextProps) {
    // Props were changed, reset new player list to state
    var newState = {
      playersIdle: _.map(nextProps.players, 'name'),
    };
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
        <Modal contentLabel="Game result" isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal} style={modalStyle}>
          <h4>Drag players to teams. Clicking on a player removes him from the team.</h4>
          <div className="row">
            <GameDragSourceContainer playerSink="playersIdle" ref={this.addComponentToDrake} width="12" extraClass="text-center dragSource" players={playerList(this.state.playersIdle)} />
          </div>
          <form role="form-horizontal" onSubmit={this.handleSubmit}>
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
              <button type="button" onClick={this.closeModal} className="btn btn-link">Cancel</button>
              <button type="submit" disabled={this.state.sendButtonDisabled} className="btn btn-primary">Save</button>
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
      return <li key={item.key} className={self.props.activeTabId === item.key ? 'active' : ''}><a href={"#" + self.props.location.pathname} onClick={self.handleTabClick.bind(self, item.key)}>{item.name}</a></li>;
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
      isMounted: false,
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
      url: window.PSG_API_URL + "/series/" + this.props.match.params.name,
      data: data,
      dataType: 'json',
      cache: false,
      success: function (data) {
        if (this.state.isMounted) {
          this.setState({ key: data.data.key, name: data.data.name, players: data.data.players });
        }
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
      url: window.PSG_API_URL + "/series/" + this.props.match.params.name + "/games",
      dataType: 'json',
      cache: false,
      success: function (data) {
        if (this.state.isMounted) {
          this.setState({ games: data.data });
        }
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(xhr, status, err.toString());
      }.bind(this),
    });
  },
  componentDidMount: function () {
    this.refreshStats();
    this.setState({isMounted: true});
  },
  componentWillUnmount: function () {
    this.setState({isMounted: false});
  },
  render: function() {
    return (
      <div className="container">
        <h2>{this.state.name}</h2>
        <SeriesStatsChooser location={this.props.location} tabs={this.state.tabs} activeTabId={this.state.activeTabId} onTabClick={this.onTabClick} />
        <PlayerList players={this.state.players} />
        { auth.loggedIn() ? <GameDragForm onGameChange={this.refreshStats} series={this.state.key} players={this.state.players} /> : null }
        <GameList games={this.state.games} />
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
        <h1>PSG stats</h1>
        <SeriesList series={this.state.series} />

        {this.props.children}
      </div>
    );
  }
});

ReactDOM.render((
  <Router>
    <div>
      <Login />
      <Route exact path="/" component={App}/>
      <Route path="/logout" component={Logout} />
      <Route path="/series/:name" component={Series} />
      <Route path="/player/:name" component={Player} />
    </div>
  </Router>
), document.getElementById('content'));

