package com.ideax.codemonitor.dto;

import com.ideax.codemonitor.github.dto.GithubUserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantSyncResponse {
    private int totalTeamsChecked;
    private int teamsMatched;
    private int participantsSynced;
    private int newParticipantsAdded;

    @Builder.Default
    private List<ParticipantResponse> participants = new ArrayList<>();

    @Builder.Default
    private List<GithubUserDto> unassignedOrgMembers = new ArrayList<>();

    @Builder.Default
    private List<String> messages = new ArrayList<>();
}
